import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import type { Database } from "./client.js";
import {
  authzEvents,
  permissions,
  rolePermissions,
  roles,
  userPlatformRoles,
  userProfiles,
} from "./schema/index.js";

/**
 * RBAC data layer: permission resolution + role mutations + authz audit.
 *
 * Every query is a narrow join keyed on (user, role) — hot path for the
 * per-request authorization service, so results are cached one layer up
 * (apps/web/src/lib/authz.ts) rather than here: this module stays a dumb,
 * cache-free data access layer that is trivial to test.
 */

export type AuthzEventInput = {
  actorId?: string | null;
  action: string;
  scope?: "platform" | "org" | null;
  resourceType?: string | null;
  resourceId?: string | null;
  permission?: string | null;
  decision: string;
  context?: Record<string, unknown> | null;
};

/** Permission keys granted to a user through platform roles (expired grants excluded). */
export async function loadPlatformPermissions(
  db: Database,
  userId: string,
): Promise<string[]> {
  const rows = await db
    .select({ key: permissions.key })
    .from(userPlatformRoles)
    .innerJoin(roles, eq(userPlatformRoles.roleId, roles.id))
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(userPlatformRoles.userId, userId),
        or(isNull(userPlatformRoles.expiresAt), gt(userPlatformRoles.expiresAt, new Date())),
      ),
    );
  return [...new Set(rows.map((r) => r.key))];
}

/** Platform role keys held by a user (expired grants excluded). */
export async function loadPlatformRoleKeys(db: Database, userId: string): Promise<string[]> {
  const rows = await db
    .select({ key: roles.key })
    .from(userPlatformRoles)
    .innerJoin(roles, eq(userPlatformRoles.roleId, roles.id))
    .where(
      and(
        eq(userPlatformRoles.userId, userId),
        or(isNull(userPlatformRoles.expiresAt), gt(userPlatformRoles.expiresAt, new Date())),
      ),
    );
  return rows.map((r) => r.key);
}

/** Permission keys attached to a role key (`org:owner`, `platform:moderator`). */
export async function loadRolePermissionKeys(db: Database, roleKey: string): Promise<string[]> {
  const rows = await db
    .select({ key: permissions.key })
    .from(roles)
    .innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(roles.key, roleKey));
  return [...new Set(rows.map((r) => r.key))];
}

export type PlatformRoleGrant = {
  userId: string;
  roleKey: string;
  grantedBy?: string | null;
  expiresAt?: Date | null;
};

/**
 * Grant a platform role by key. Fails loudly when the role row does not
 * exist — a silent no-op would mask a misconfigured seed as "no permission".
 */
export async function grantPlatformRole(
  db: Database,
  grant: PlatformRoleGrant,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [role] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.key, grant.roleKey))
    .limit(1);
  if (!role) return { ok: false, error: `Unknown role: ${grant.roleKey}` };
  await db
    .insert(userPlatformRoles)
    .values({
      userId: grant.userId,
      roleId: role.id,
      grantedBy: grant.grantedBy ?? null,
      expiresAt: grant.expiresAt ?? null,
    })
    .onConflictDoNothing();
  // Legacy compat: is_moderator stays true while any moderator-capable grant exists.
  if (grant.roleKey === "platform:moderator" || grant.roleKey === "platform:admin") {
    await db
      .update(userProfiles)
      .set({ isModerator: true, updatedAt: new Date() })
      .where(eq(userProfiles.id, grant.userId));
  }
  return { ok: true };
}

export async function revokePlatformRole(
  db: Database,
  userId: string,
  roleKey: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [role] = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.key, roleKey))
    .limit(1);
  if (!role) return { ok: false, error: `Unknown role: ${roleKey}` };
  await db
    .delete(userPlatformRoles)
    .where(and(eq(userPlatformRoles.userId, userId), eq(userPlatformRoles.roleId, role.id)));
  if (roleKey === "platform:moderator" || roleKey === "platform:admin") {
    // Recompute: another capable grant may still exist.
    const remaining = await loadPlatformRoleKeys(db, userId);
    const stillCapable = remaining.some(
      (k) => k === "platform:moderator" || k === "platform:admin",
    );
    await db
      .update(userProfiles)
      .set({ isModerator: stillCapable, updatedAt: new Date() })
      .where(eq(userProfiles.id, userId));
  }
  return { ok: true };
}

/** Append an authorization audit event. Never throws — auditing must not break the guarded action. */
export async function recordAuthzEvent(db: Database, event: AuthzEventInput): Promise<void> {
  try {
    await db.insert(authzEvents).values({
      actorId: event.actorId ?? null,
      action: event.action,
      scope: event.scope ?? null,
      resourceType: event.resourceType ?? null,
      resourceId: event.resourceId ?? null,
      permission: event.permission ?? null,
      decision: event.decision,
      context: (event.context ?? null) as never,
    });
  } catch {
    // Audit failure is surfaced via caller-side structured logging, never
    // allowed to mask the original authorization outcome.
  }
}

/** Count of authz events by action — feeds the monitoring snapshot. */
export async function countAuthzEvents(
  db: Database,
  action: string,
  since: Date,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(authzEvents)
    .where(and(eq(authzEvents.action, action), gt(authzEvents.createdAt, since)));
  return row?.count ?? 0;
}
