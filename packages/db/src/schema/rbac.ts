import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, id } from "./core.js";
import { userProfiles } from "./members.js";

/**
 * RBAC: roles, permissions, grants, and authz-specific audit.
 *
 * Design principles:
 *  - Permission keys are DATA (`permissions` rows) — adding a permission or
 *    attaching one to a role is a seed/insert, never a code change.
 *  - `roles.rank` is the escalation guard: a grantor can only assign roles at
 *    or below their own effective rank (enforced in the authz service).
 *  - `authz_events` is separate from `moderation_actions`/`audit_logs`:
 *    authorization decisions (grants, revokes, denials) are a distinct audit
 *    stream that moderation workflow noise must never drown out.
 *
 * Org role keys mirror the `org_role` enum (org:owner / org:editor /
 * org:viewer) so the enum stays the type-level contract while the
 * role→permission mapping stays data-driven. Platform roles are fully
 * table-driven (no enum).
 */

export const rbacScopeEnum = pgEnum("rbac_scope", ["platform", "org"]);

export const permissions = pgTable(
  "permissions",
  {
    id: id(),
    /** `resource:action` — e.g. `events:edit`, `platform:moderate`. */
    key: text("key").notNull(),
    scope: rbacScopeEnum("scope").notNull(),
    description: text("description"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("permissions_key_idx").on(t.key),
    index("permissions_scope_idx").on(t.scope),
  ],
);

export const roles = pgTable(
  "roles",
  {
    id: id(),
    /** Scoped key: `platform:moderator`, `org:owner`. */
    key: text("key").notNull(),
    scope: rbacScopeEnum("scope").notNull(),
    /** Higher = more powerful. Grant guard: target rank <= grantor rank. */
    rank: integer("rank").notNull().default(0),
    description: text("description"),
    /** Built-in roles cannot be deleted; their permission set can still grow. */
    isBuiltIn: boolean("is_built_in").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("roles_key_idx").on(t.key),
    index("roles_scope_idx").on(t.scope),
  ],
);

/** Role → permission grants. Adding a permission to a role = one INSERT. */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.roleId, t.permissionId] }),
    index("role_permissions_permission_idx").on(t.permissionId),
  ],
);

/**
 * Platform-scope grants (moderator/admin/…). Org grants stay on
 * `organization_memberships.role`; this table gives platform roles the grant
 * provenance, expiry, and revocable trail that `is_moderator` never had.
 * `user_profiles.is_moderator` remains as a legacy read-compat column
 * (seeded from this table until all callers migrate).
 */
export const userPlatformRoles = pgTable(
  "user_platform_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    /** Who granted it (null = system/seed migration). */
    grantedBy: uuid("granted_by"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.roleId] }),
    index("user_platform_roles_role_idx").on(t.roleId),
  ],
);

/**
 * Authorization audit: role grants/revokes and access decisions the
 * moderation workflow does not cover. Append-only by convention; denials are
 * recorded so privilege-escalation attempts are visible, not just successes.
 */
export const authzEvents = pgTable(
  "authz_events",
  {
    id: id(),
    /** Null actor = anonymous attempt (e.g. unauthenticated API probe). */
    actorId: uuid("actor_id"),
    /** `role.granted` | `role.revoked` | `role.changed` | `access.denied`. */
    action: text("action").notNull(),
    scope: rbacScopeEnum("scope"),
    resourceType: text("resource_type"),
    resourceId: uuid("resource_id"),
    /** Permission key evaluated (denials) or granted (role events). */
    permission: text("permission"),
    decision: text("decision").notNull(),
    context: jsonb("context"),
    createdAt: createdAt(),
  },
  (t) => [
    index("authz_events_actor_idx").on(t.actorId, t.createdAt),
    index("authz_events_action_idx").on(t.action, t.createdAt),
    index("authz_events_created_idx").on(t.createdAt),
  ],
);
