import { describe, expect, it } from "vitest";
import { createAuthorization, type AuthzDeps, type Authorization } from "./authz.js";

type CapturedEvent = NonNullable<Parameters<AuthzDeps["recordEvent"]>[0]>;

function makeDeps(options: {
  platformPerms?: Record<string, string[]>;
  platformRoles?: Record<string, string[]>;
  rolePerms?: Record<string, string[]>;
  orgRoles?: Record<string, "owner" | "editor" | "viewer" | null>;
  now?: () => number;
} = {}): AuthzDeps & { events: CapturedEvent[] } {
  const events: CapturedEvent[] = [];
  return {
    events,
    loadPlatformPermissions: async (userId) => options.platformPerms?.[userId] ?? [],
    loadPlatformRoleKeys: async (userId) => options.platformRoles?.[userId] ?? [],
    loadRolePermissionKeys: async (roleKey) => options.rolePerms?.[roleKey] ?? [],
    getOrgRole: async (userId, orgId) => options.orgRoles?.[`${userId}:${orgId}`] ?? null,
    recordEvent: async (event) => { events.push(event); },
    now: options.now ?? (() => 1_000_000),
  };
}

function service(deps: AuthzDeps, ttl: { userTtlMs?: number; roleTtlMs?: number } = {}): Authorization {
  return createAuthorization(deps, ttl);
}

describe("checkPlatformPermission", () => {
  it("allows when the user holds the permission", async () => {
    const deps = makeDeps({ platformPerms: { mod: ["platform:moderate"] } });
    const authz = service(deps);
    const decision = await authz.checkPlatformPermission("mod", "platform:moderate");
    expect(decision.allowed).toBe(true);
    expect(decision.reason).toBeNull();
    expect(deps.events).toHaveLength(0);
  });

  it("denies and audits when the permission is missing", async () => {
    const deps = makeDeps({ platformPerms: { user: [] } });
    const authz = service(deps);
    const decision = await authz.checkPlatformPermission("user", "platform:moderate", { path: "/moderation" });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("missing_permission");
    expect(deps.events).toHaveLength(1);
    expect(deps.events[0]).toMatchObject({
      actorId: "user", action: "access.denied", scope: "platform",
      permission: "platform:moderate", decision: "deny",
    });
    expect(deps.events[0]!.context).toMatchObject({ path: "/moderation" });
  });

  it("denies unauthenticated callers with a null-actor audit row", async () => {
    const deps = makeDeps();
    const authz = service(deps);
    const decision = await authz.checkPlatformPermission(null, "platform:moderate");
    expect(decision.reason).toBe("unauthenticated");
    expect(deps.events[0]!.actorId).toBeNull();
  });
});

describe("checkOrgPermission", () => {
  it("allows members whose role grants the permission", async () => {
    const deps = makeDeps({ rolePerms: { "org:editor": ["org:view", "events:edit"] } });
    deps.getOrgRole = async () => "editor";
    const authz = service(deps);
    const decision = await authz.checkOrgPermission("u1", "org1", "events:edit");
    expect(decision.allowed).toBe(true);
  });

  it("denies non-members with no_membership", async () => {
    const deps = makeDeps();
    const authz = service(deps);
    const decision = await authz.checkOrgPermission("u1", "org1", "org:view");
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("no_membership");
    expect(deps.events[0]!.context).toMatchObject({ orgId: "org1" });
  });

  it("denies when the role lacks the permission", async () => {
    const deps = makeDeps({ rolePerms: { "org:viewer": ["org:view"] } });
    deps.getOrgRole = async () => "viewer";
    const authz = service(deps);
    const decision = await authz.checkOrgPermission("u1", "org1", "events:edit");
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("missing_permission");
    expect(deps.events[0]!.context).toMatchObject({ orgId: "org1", role: "viewer" });
  });

  it("falls back to the built-in role map when the DB mapping is empty", async () => {
    const deps = makeDeps();
    deps.getOrgRole = async () => "editor";
    const authz = service(deps);
    const decision = await authz.checkOrgPermission("u1", "org1", "events:create");
    expect(decision.allowed).toBe(true);
    const denied = await authz.checkOrgPermission("u1", "org1", "org:manage_members");
    expect(denied.allowed).toBe(false);
  });
});

describe("caching & metrics", () => {
  it("serves repeat checks from cache and tracks hit/miss", async () => {
    const deps = makeDeps({ platformPerms: { mod: ["platform:moderate"] } });
    const authz = service(deps, { userTtlMs: 60_000 });
    await authz.checkPlatformPermission("mod", "platform:moderate");
    await authz.checkPlatformPermission("mod", "platform:moderate");
    const metrics = authz.getMetrics();
    expect(metrics.checks).toBe(2);
    expect(metrics.cacheMisses).toBe(1);
    expect(metrics.cacheHits).toBe(1);
  });

  it("invalidate drops the cached grants", async () => {
    let perms = ["platform:moderate"];
    const deps = makeDeps({ platformPerms: {} });
    deps.loadPlatformPermissions = async () => perms;
    const authz = service(deps, { userTtlMs: 60_000 });
    await authz.getPlatformPermissions("u1");
    perms = [];
    expect(await authz.getPlatformPermissions("u1")).toEqual(["platform:moderate"]);
    authz.invalidate("u1");
    expect(await authz.getPlatformPermissions("u1")).toEqual([]);
  });

  it("cache expires after the TTL", async () => {
    let time = 0;
    const deps = makeDeps({ platformPerms: { u1: ["a"] }, now: () => time });
    const authz = service(deps, { userTtlMs: 1_000 });
    await authz.getPlatformPermissions("u1");
    time = 1_001;
    await authz.getPlatformPermissions("u1");
    expect(authz.getMetrics().cacheMisses).toBe(2);
  });

  it("tracks denials by permission", async () => {
    const deps = makeDeps();
    const authz = service(deps);
    await authz.checkPlatformPermission(null, "platform:moderate");
    await authz.checkPlatformPermission(null, "platform:moderate");
    await authz.checkPlatformPermission(null, "platform:grant_roles");
    const metrics = authz.getMetrics();
    expect(metrics.denials).toBe(3);
    expect(metrics.denialsByPermission).toEqual({
      "platform:moderate": 2,
      "platform:grant_roles": 1,
    });
  });
});

describe("role change audit", () => {
  it("records org-scoped role events with previous role context", async () => {
    const deps = makeDeps();
    const authz = service(deps);
    await authz.recordRoleChange({
      actorId: "owner-1", targetUserId: "member-9", roleKey: "org:owner",
      action: "role.granted", previousRole: "editor", resourceId: "org-1",
    });
    expect(deps.events[0]).toMatchObject({
      actorId: "owner-1", action: "role.granted", scope: "org",
      permission: "org:owner", decision: "allow", resourceId: "org-1",
    });
    expect(deps.events[0]!.context).toMatchObject({ targetUserId: "member-9", previousRole: "editor" });
  });

  it("infers platform scope from the role key", async () => {
    const deps = makeDeps();
    const authz = service(deps);
    await authz.recordRoleChange({
      actorId: "admin-1", targetUserId: "u2", roleKey: "platform:moderator", action: "role.granted",
    });
    expect(deps.events[0]!.scope).toBe("platform");
  });

  it("recordDenial captures escalation attempts with context", async () => {
    const deps = makeDeps();
    const authz = service(deps);
    await authz.recordDenial({
      actorId: "editor-1", permission: "org:owner", scope: "org",
      reason: "escalation_blocked",
      context: { actorRole: "editor", targetRole: "owner" },
    });
    expect(deps.events[0]).toMatchObject({
      actorId: "editor-1", action: "access.denied", decision: "deny", permission: "org:owner",
    });
    expect(deps.events[0]!.context).toMatchObject({
      reason: "escalation_blocked", actorRole: "editor", targetRole: "owner",
    });
    expect(authz.getMetrics().denials).toBe(1);
  });
});
