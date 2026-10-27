import { describe, expect, it } from "vitest";
import {
  roleHasPermission,
  can,
  canAssignOrgRole,
  canAssignPlatformRole,
  platformRoleKey,
  platformRoleRank,
  ORG_ROLE_PERMISSIONS,
  ORG_ROLE_RANKS,
  PLATFORM_ROLES,
  type Membership,
} from "./permissions.js";

describe("roleHasPermission", () => {
  it("viewer can only view", () => {
    expect(roleHasPermission("viewer", "org:view")).toBe(true);
    expect(roleHasPermission("viewer", "org:edit")).toBe(false);
    expect(roleHasPermission("viewer", "events:create")).toBe(false);
    expect(roleHasPermission("viewer", "events:delete")).toBe(false);
    expect(roleHasPermission("viewer", "org:manage_members")).toBe(false);
  });

  it("editor can edit but not manage members or delete", () => {
    expect(roleHasPermission("editor", "org:view")).toBe(true);
    expect(roleHasPermission("editor", "org:edit")).toBe(true);
    expect(roleHasPermission("editor", "events:create")).toBe(true);
    expect(roleHasPermission("editor", "events:edit")).toBe(true);
    expect(roleHasPermission("editor", "series:manage")).toBe(true);
    expect(roleHasPermission("editor", "announcements:configure")).toBe(true);
    expect(roleHasPermission("editor", "org:manage_members")).toBe(false);
    expect(roleHasPermission("editor", "events:delete")).toBe(false);
  });

  it("owner has every permission", () => {
    const all = [
      "org:view",
      "org:edit",
      "org:manage_members",
      "events:create",
      "events:edit",
      "events:delete",
      "series:manage",
      "announcements:configure",
    ] as const;
    for (const p of all) {
      expect(roleHasPermission("owner", p)).toBe(true);
    }
  });
});

describe("can", () => {
  const memberships: Membership[] = [
    { orgId: "org-1", role: "editor" },
    { orgId: "org-2", role: "viewer" },
  ];

  it("returns true when membership grants the permission", () => {
    expect(can(memberships, "org-1", "events:create")).toBe(true);
    expect(can(memberships, "org-2", "org:view")).toBe(true);
  });

  it("returns false when membership lacks the permission", () => {
    expect(can(memberships, "org-2", "events:create")).toBe(false);
  });

  it("returns false when no membership exists for the org", () => {
    expect(can(memberships, "org-999", "org:view")).toBe(false);
  });

  it("returns false for empty memberships", () => {
    expect(can([], "org-1", "org:view")).toBe(false);
  });
});

describe("escalation guards", () => {
  it("owner may assign owner, editor, viewer", () => {
    expect(canAssignOrgRole("owner", "owner")).toBe(true);
    expect(canAssignOrgRole("owner", "editor")).toBe(true);
    expect(canAssignOrgRole("owner", "viewer")).toBe(true);
  });

  it("editor may assign editor/viewer but never owner", () => {
    expect(canAssignOrgRole("editor", "editor")).toBe(true);
    expect(canAssignOrgRole("editor", "viewer")).toBe(true);
    expect(canAssignOrgRole("editor", "owner")).toBe(false);
  });

  it("viewer may never escalate anyone above viewer", () => {
    // Same-rank passes the rank guard (not an elevation); the real gate for
    // membership management is org:manage_members, which viewers lack.
    expect(canAssignOrgRole("viewer", "viewer")).toBe(true);
    expect(canAssignOrgRole("viewer", "editor")).toBe(false);
    expect(canAssignOrgRole("viewer", "owner")).toBe(false);
  });

  it("org role ranks are strictly ordered", () => {
    expect(ORG_ROLE_RANKS.owner).toBeGreaterThan(ORG_ROLE_RANKS.editor);
    expect(ORG_ROLE_RANKS.editor).toBeGreaterThan(ORG_ROLE_RANKS.viewer);
  });
});

describe("platform roles", () => {
  it("rank and key helpers resolve built-in roles", () => {
    expect(platformRoleKey("moderator")).toBe("platform:moderator");
    expect(platformRoleRank("platform:member")).toBe(0);
    expect(platformRoleRank("platform:moderator")).toBe(100);
    expect(platformRoleRank("platform:admin")).toBe(200);
    expect(platformRoleRank("platform:unknown")).toBe(-1);
  });

  it("admin holds grant_roles; moderator does not", () => {
    const admin = PLATFORM_ROLES.find((r) => r.key === "admin")!;
    const moderator = PLATFORM_ROLES.find((r) => r.key === "moderator")!;
    expect(admin.permissions).toContain("platform:grant_roles");
    expect(moderator.permissions).not.toContain("platform:grant_roles");
  });

  it("admin can grant admin and moderator", () => {
    expect(
      canAssignPlatformRole(["platform:admin"], ["platform:grant_roles"], "platform:admin"),
    ).toBe(true);
    expect(
      canAssignPlatformRole(["platform:admin"], ["platform:grant_roles"], "platform:moderator"),
    ).toBe(true);
  });

  it("nobody without grant_roles can assign anything", () => {
    expect(
      canAssignPlatformRole(["platform:admin"], ["platform:moderate"], "platform:moderator"),
    ).toBe(false);
    expect(canAssignPlatformRole(["platform:member"], [], "platform:member")).toBe(false);
  });

  it("rank ceiling blocks assigning above grantor rank", () => {
    // hypothetical grantor with grant_roles but only moderator rank
    expect(
      canAssignPlatformRole(
        ["platform:moderator"],
        ["platform:grant_roles"],
        "platform:admin",
      ),
    ).toBe(false);
    expect(
      canAssignPlatformRole(
        ["platform:moderator"],
        ["platform:grant_roles"],
        "platform:moderator",
      ),
    ).toBe(true);
  });
});

describe("org role permission seeds", () => {
  it("every built-in org role resolves at least org:view", () => {
    for (const role of ["viewer", "editor", "owner"] as const) {
      expect(ORG_ROLE_PERMISSIONS[role]).toContain("org:view");
    }
  });

  it("editor permission set is a subset of owner", () => {
    const owner = new Set<string>(ORG_ROLE_PERMISSIONS.owner);
    for (const p of ORG_ROLE_PERMISSIONS.editor) expect(owner.has(p)).toBe(true);
  });
});