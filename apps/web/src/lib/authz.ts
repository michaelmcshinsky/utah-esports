import {
  ORG_ROLE_PERMISSIONS,
  roleHasPermission,
  type OrgPermission,
  type OrgRole,
} from "@utah-esports/core";
import {
  getMembershipsForUser,
  loadRolePermissionKeys as dbLoadRolePermissionKeys,
  loadPlatformPermissions as dbLoadPlatformPermissions,
  loadPlatformRoleKeys as dbLoadPlatformRoleKeys,
  recordAuthzEvent as dbRecordAuthzEvent,
} from "@utah-esports/db";
import { db } from "./db.js";

/**
 * Centralized authorization service — the single place where every access
 * decision is made. Routes/pages call the guards in `authz-guard.ts`; this
 * module owns resolution, caching, denial audit, and metrics.
 *
 * Layering:
 *   db (data) → authz (decisions) → authz-guard (HTTP) → routes/pages
 */

export type AuthzDecision = {
  allowed: boolean;
  reason: "unauthenticated" | "missing_permission" | "no_membership" | null;
  permissions: string[];
};

export type DenialMeta = {
  path?: string;
  resourceType?: string;
  resourceId?: string;
};

export type AuthzDeps = {
  loadPlatformPermissions(userId: string): Promise<string[]>;
  loadPlatformRoleKeys(userId: string): Promise<string[]>;
  loadRolePermissionKeys(roleKey: string): Promise<string[]>;
  getOrgRole(userId: string, orgId: string): Promise<OrgRole | null>;
  recordEvent(event: {
    actorId?: string | null;
    action: string;
    scope?: "platform" | "org" | null;
    resourceType?: string | null;
    resourceId?: string | null;
    permission?: string | null;
    decision: string;
    context?: Record<string, unknown> | null;
  }): Promise<void>;
  now(): number;
};

export type AuthzOptions = { userTtlMs?: number; roleTtlMs?: number };

export type AuthzMetrics = {
  checks: number;
  denials: number;
  cacheHits: number;
  cacheMisses: number;
  denialsByPermission: Record<string, number>;
};

type CacheEntry<T> = { value: T; expires: number };

export type Authorization = ReturnType<typeof createAuthorization>;

export function createAuthorization(deps: AuthzDeps, options: AuthzOptions = {}) {
  const userTtl = options.userTtlMs ?? 60_000;
  const roleTtl = options.roleTtlMs ?? 300_000;
  const userCache = new Map<string, CacheEntry<string[]>>();
  const roleCache = new Map<string, CacheEntry<string[]>>();
  const metrics: AuthzMetrics = {
    checks: 0, denials: 0, cacheHits: 0, cacheMisses: 0, denialsByPermission: {},
  };

  function readCache<T>(map: Map<string, CacheEntry<T>>, key: string): T | undefined {
    const hit = map.get(key);
    if (!hit) return undefined;
    if (hit.expires <= deps.now()) { map.delete(key); return undefined; }
    metrics.cacheHits++;
    return hit.value;
  }

  function writeCache<T>(map: Map<string, CacheEntry<T>>, key: string, value: T, ttl: number) {
    map.set(key, { value, expires: deps.now() + ttl });
  }

  async function getPlatformPermissions(userId: string): Promise<string[]> {
    const key = `user:${userId}`;
    const cached = readCache(userCache, key);
    if (cached) return cached;
    metrics.cacheMisses++;
    const perms = await deps.loadPlatformPermissions(userId);
    writeCache(userCache, key, perms, userTtl);
    return perms;
  }

  async function getPlatformRoleKeys(userId: string): Promise<string[]> {
    const key = `roles:${userId}`;
    const cached = readCache(userCache, key);
    if (cached) return cached;
    metrics.cacheMisses++;
    const keys = await deps.loadPlatformRoleKeys(userId);
    writeCache(userCache, key, keys, userTtl);
    return keys;
  }

  async function getOrgRolePermissions(role: OrgRole): Promise<string[]> {
    const key = `org-role:${role}`;
    const cached = readCache(roleCache, key);
    if (cached) return cached;
    metrics.cacheMisses++;
    let perms = await deps.loadRolePermissionKeys(`org:${role}`);
    if (perms.length === 0) perms = [...ORG_ROLE_PERMISSIONS[role]];
    writeCache(roleCache, key, perms, roleTtl);
    return perms;
  }

  async function deny(
    actorId: string | null, permission: string, scope: "platform" | "org",
    meta: DenialMeta | undefined, reason: AuthzDecision["reason"],
    extra?: Record<string, unknown>,
  ): Promise<AuthzDecision> {
    metrics.denials++;
    metrics.denialsByPermission[permission] = (metrics.denialsByPermission[permission] ?? 0) + 1;
    await deps.recordEvent({
      actorId, action: "access.denied", scope,
      resourceType: meta?.resourceType ?? null, resourceId: meta?.resourceId ?? null,
      permission, decision: "deny",
      context: { path: meta?.path ?? null, reason, ...extra },
    });
    return { allowed: false, reason, permissions: [] };
  }

  async function checkPlatformPermission(
    userId: string | null, permission: string, meta?: DenialMeta,
  ): Promise<AuthzDecision> {
    metrics.checks++;
    if (!userId) return deny(null, permission, "platform", meta, "unauthenticated");
    const perms = await getPlatformPermissions(userId);
    if (!perms.includes(permission)) return deny(userId, permission, "platform", meta, "missing_permission");
    return { allowed: true, reason: null, permissions: perms };
  }

  async function checkOrgPermission(
    userId: string | null, orgId: string, permission: string, meta?: DenialMeta,
  ): Promise<AuthzDecision> {
    metrics.checks++;
    if (!userId) return deny(null, permission, "org", meta, "unauthenticated");
    const role = await deps.getOrgRole(userId, orgId);
    if (!role) return deny(userId, permission, "org", meta, "no_membership", { orgId });
    const perms = await getOrgRolePermissions(role);
    if (!perms.includes(permission)) return deny(userId, permission, "org", meta, "missing_permission", { orgId, role });
    return { allowed: true, reason: null, permissions: perms };
  }

  function checkOrgRoleSync(role: OrgRole, permission: OrgPermission): boolean {
    return roleHasPermission(role, permission);
  }

  function recordRoleChange(event: {
    actorId: string; targetUserId: string; roleKey: string;
    action: "role.granted" | "role.revoked" | "role.changed";
    previousRole?: string | null; resourceType?: string; resourceId?: string;
  }): Promise<void> {
    return deps.recordEvent({
      actorId: event.actorId, action: event.action,
      scope: event.roleKey.startsWith("org:") ? "org" : "platform",
      resourceType: event.resourceType ?? null, resourceId: event.resourceId ?? null,
      permission: event.roleKey, decision: "allow",
      context: { targetUserId: event.targetUserId, previousRole: event.previousRole ?? null },
    });
  }

  function recordDenial(event: {
    actorId: string | null; permission: string;
    scope: "platform" | "org"; meta?: DenialMeta;
    reason?: string; context?: Record<string, unknown>;
  }): Promise<void> {
    metrics.denials++;
    metrics.denialsByPermission[event.permission] =
      (metrics.denialsByPermission[event.permission] ?? 0) + 1;
    return deps.recordEvent({
      actorId: event.actorId, action: "access.denied", scope: event.scope,
      resourceType: event.meta?.resourceType ?? null, resourceId: event.meta?.resourceId ?? null,
      permission: event.permission, decision: "deny",
      context: { path: event.meta?.path ?? null, reason: event.reason ?? "missing_permission", ...event.context },
    });
  }

  function invalidate(userId?: string) {
    if (!userId) { userCache.clear(); roleCache.clear(); return; }
    userCache.delete(`user:${userId}`);
    userCache.delete(`roles:${userId}`);
  }

  return {
    getPlatformPermissions, getPlatformRoleKeys, getOrgRolePermissions,
    checkPlatformPermission, checkOrgPermission, checkOrgRoleSync,
    recordRoleChange, recordDenial, invalidate,
    getMetrics: (): AuthzMetrics => ({ ...metrics, denialsByPermission: { ...metrics.denialsByPermission } }),
    resetMetrics() { metrics.checks = 0; metrics.denials = 0; metrics.cacheHits = 0; metrics.cacheMisses = 0; metrics.denialsByPermission = {}; },
  };
}

export const authorization = createAuthorization({
  loadPlatformPermissions: (userId) => dbLoadPlatformPermissions(db(), userId),
  loadPlatformRoleKeys: (userId) => dbLoadPlatformRoleKeys(db(), userId),
  loadRolePermissionKeys: (roleKey) => dbLoadRolePermissionKeys(db(), roleKey),
  getOrgRole: async (userId, orgId) => {
    const memberships = await getMembershipsForUser(db(), userId);
    return memberships.find((m) => m.orgId === orgId)?.role ?? null;
  },
  recordEvent: (event) => dbRecordAuthzEvent(db(), event),
  now: () => Date.now(),
});
