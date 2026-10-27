import { and, eq, ne } from "drizzle-orm";
import {
  ORG_PERMISSIONS,
  ORG_ROLE_PERMISSIONS,
  ORG_ROLE_RANKS,
  PLATFORM_PERMISSIONS,
  PLATFORM_ROLES,
  orgRoleKey,
  platformRoleKey,
} from "@utah-esports/core";
import type { OrgRole } from "@utah-esports/core";
import { getDb } from "../client.js";
import { permissions, roles, rolePermissions, userPlatformRoles, userProfiles } from "../schema/index.js";

/**
 * RBAC seed — idempotent bootstrap of permission/role/grant rows.
 *
 * The runtime authorization service reads ONLY the tables; this seed is the
 * contract that bootstraps them (and re-runs safely in CI or after a fresh
 * migration). Adding a permission later = insert a `permissions` row and a
 * `role_permissions` row — no code, no deploy.
 */
export async function seedRbac(): Promise<void> {
  const db = getDb();

  // 1. Permissions (org scope from ORG_PERMISSIONS, platform scope from PLATFORM_PERMISSIONS)
  for (const key of ORG_PERMISSIONS) {
    await db
      .insert(permissions)
      .values({ key, scope: "org", description: `Organization scope: ${key}` })
      .onConflictDoNothing();
  }
  for (const key of PLATFORM_PERMISSIONS) {
    await db
      .insert(permissions)
      .values({ key, scope: "platform", description: `Platform scope: ${key}` })
      .onConflictDoNothing();
  }

  // 2. Roles (platform from PLATFORM_ROLES, org mirrors for the enum)
  for (const role of PLATFORM_ROLES) {
    await db
      .insert(roles)
      .values({
        key: platformRoleKey(role.key),
        scope: "platform",
        rank: role.rank,
        description: `Built-in platform role: ${role.key}`,
        isBuiltIn: true,
      })
      .onConflictDoNothing();
  }
  for (const orgRole of Object.keys(ORG_ROLE_RANKS) as OrgRole[]) {
    await db
      .insert(roles)
      .values({
        key: orgRoleKey(orgRole),
        scope: "org",
        rank: ORG_ROLE_RANKS[orgRole],
        description: `Built-in organization role: ${orgRole}`,
        isBuiltIn: true,
      })
      .onConflictDoNothing();
  }

  // 3. role_permissions backfill
  const attach = async (roleKey: string, permKeys: readonly string[]) => {
    const [role] = await db.select().from(roles).where(eq(roles.key, roleKey)).limit(1);
    if (!role) return;
    for (const permKey of permKeys) {
      const [perm] = await db
        .select()
        .from(permissions)
        .where(eq(permissions.key, permKey))
        .limit(1);
      if (!perm) continue;
      await db
        .insert(rolePermissions)
        .values({ roleId: role.id, permissionId: perm.id })
        .onConflictDoNothing();
    }
  };
  for (const orgRole of Object.keys(ORG_ROLE_PERMISSIONS) as OrgRole[]) {
    await attach(orgRoleKey(orgRole), ORG_ROLE_PERMISSIONS[orgRole]);
  }
  for (const role of PLATFORM_ROLES) {
    await attach(platformRoleKey(role.key), role.permissions);
  }

  // 4. Bridge: legacy is_moderator flag → platform:moderator grant row.
  //    One-way; afterwards the table is authoritative and the flag is only
  //    kept in sync by grant/revoke for read-compat callers.
  const mods = await db
    .select({ id: userProfiles.id })
    .from(userProfiles)
    .where(and(eq(userProfiles.isModerator, true), ne(userProfiles.isModerator, false)));
  const [moderatorRole] = await db
    .select()
    .from(roles)
    .where(eq(roles.key, platformRoleKey("moderator")))
    .limit(1);
  if (moderatorRole) {
    for (const m of mods) {
      await db
        .insert(userPlatformRoles)
        .values({ userId: m.id, roleId: moderatorRole.id, grantedBy: null })
        .onConflictDoNothing();
    }
  }
  console.log(
    `rbac seeded: permissions=${Object.keys(ORG_PERMISSIONS).length + Object.keys(PLATFORM_PERMISSIONS).length}, roles=${PLATFORM_ROLES.length + Object.keys(ORG_ROLE_RANKS).length}, moderator bridge=${mods.length}`,
  );
}
