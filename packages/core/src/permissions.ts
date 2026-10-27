import type { OrgRole } from "./domain.js";

/**
 * Organization permissions are the ownership boundary for editing.
 * Platform moderators hold a separate privilege outside org membership.
 */

export const ORG_PERMISSIONS = [
  "org:view",
  "org:edit",
  "org:manage_members",
  "events:create",
  "events:edit",
  "events:delete",
  "series:manage",
  "announcements:configure",
] as const;
export type OrgPermission = (typeof ORG_PERMISSIONS)[number];

/**
 * Built-in org role → permission map. Seed source for `role_permissions` —
 * the runtime reads the DB so new permissions attach without deploys; this
 * record is the bootstrap contract and the default when a row is missing.
 */
export const ORG_ROLE_PERMISSIONS: Record<OrgRole, readonly OrgPermission[]> = {
  viewer: ["org:view"],
  editor: [
    "org:view",
    "org:edit",
    "events:create",
    "events:edit",
    "series:manage",
    "announcements:configure",
  ],
  owner: ORG_PERMISSIONS,
};

export function roleHasPermission(role: OrgRole, permission: OrgPermission): boolean {
  return ORG_ROLE_PERMISSIONS[role].includes(permission);
}

export type Membership = {
  orgId: string;
  role: OrgRole;
};

export function can(
  memberships: readonly Membership[],
  orgId: string,
  permission: OrgPermission,
): boolean {
  const membership = memberships.find((m) => m.orgId === orgId);
  if (!membership) return false;
  return roleHasPermission(membership.role, permission);
}

// ---------------------------------------------------------------------------
// Platform scope — roles & permissions outside org membership
// ---------------------------------------------------------------------------

/**
 * Platform permissions live outside any organization: moderation queues,
 * role granting, cross-org content decisions. Keep this list small —
 * platform roles are the blast radius of the whole deployment.
 */
export const PLATFORM_PERMISSIONS = [
  /** Act on moderation queues (submissions, claims, reports, duplicates). */
  "platform:moderate",
  /** Grant/revoke platform roles below own rank. */
  "platform:grant_roles",
  /** Configure platform-level content (redirects, catalog). */
  "platform:manage_content",
] as const;
export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number];

export type PlatformRole = {
  /** Matches `roles.key` (unscoped suffix): member / moderator / admin. */
  key: string;
  rank: number;
  permissions: readonly PlatformPermission[];
};

/**
 * Built-in platform roles. Seed source for the `roles`/`role_permissions`
 * tables — the runtime reads the DB, this list is the bootstrap contract.
 */
export const PLATFORM_ROLES: readonly PlatformRole[] = [
  { key: "member", rank: 0, permissions: [] },
  { key: "moderator", rank: 100, permissions: ["platform:moderate"] },
  {
    key: "admin",
    rank: 200,
    permissions: ["platform:moderate", "platform:grant_roles", "platform:manage_content"],
  },
];

export const PLATFORM_ROLE_KEY_PREFIX = "platform:";

export function platformRoleKey(key: string): string {
  return `${PLATFORM_ROLE_KEY_PREFIX}${key}`;
}

export function platformRoleRank(roleKey: string): number {
  return PLATFORM_ROLES.find((r) => platformRoleKey(r.key) === roleKey)?.rank ?? -1;
}

// ---------------------------------------------------------------------------
// Escalation guards (pure — no I/O, unit-testable)
// ---------------------------------------------------------------------------

/**
 * Org role ranks. Higher rank = more powerful; grants may never exceed the
 * grantor's own rank (owner→owner OK, editor→owner blocked, viewer→anyone
 * blocked because viewers never hold org:manage_members).
 */
export const ORG_ROLE_RANKS: Record<OrgRole, number> = {
  viewer: 100,
  editor: 200,
  owner: 300,
};

export function orgRoleKey(role: OrgRole): string {
  return `org:${role}`;
}

/**
 * Privilege-escalation guard: may `actorRole` assign `targetRole`?
 * A grantor can grant any role at or below their own rank — never above.
 * Defense-in-depth: callers also require `org:manage_members`, this closes
 * the "owner grants... wait, editor grants owner" class if a future role
 * loosens the permission map.
 */
export function canAssignOrgRole(actorRole: OrgRole, targetRole: OrgRole): boolean {
  return ORG_ROLE_RANKS[targetRole] <= ORG_ROLE_RANKS[actorRole];
}

/**
 * Privilege-escalation guard for platform roles. The grantor must hold
 * `platform:grant_roles` and can only assign roles at or below their highest
 * held rank (admin can grant admin/moderator; moderator cannot grant at all
 * without grant_roles; nobody self-elevates past their own ceiling).
 */
export function canAssignPlatformRole(
  actorRoleKeys: readonly string[],
  actorPermissions: readonly string[],
  targetRoleKey: string,
): boolean {
  if (!actorPermissions.includes("platform:grant_roles")) return false;
  const actorRank = actorRoleKeys.reduce((max, key) => Math.max(max, platformRoleRank(key)), -1);
  return platformRoleRank(targetRoleKey) <= actorRank;
}
