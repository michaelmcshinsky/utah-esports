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

const ROLE_PERMISSIONS: Record<OrgRole, readonly OrgPermission[]> = {
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
  return ROLE_PERMISSIONS[role].includes(permission);
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

export type ModeratorScope =
  | { kind: "platform" }
  | { kind: "org"; orgId: string; role: OrgRole };

export function canModerate(
  scopes: readonly ModeratorScope[],
  permission: OrgPermission,
  orgId?: string,
): boolean {
  return scopes.some((scope) => {
    if (scope.kind === "platform") return true;
    if (orgId && scope.orgId === orgId) {
      return roleHasPermission(scope.role, permission);
    }
    return false;
  });
}
