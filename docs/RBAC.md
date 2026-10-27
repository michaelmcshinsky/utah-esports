# RBAC — Role-Based Access Control

**Scope:** platform roles (site-wide) + organization roles (membership-scoped)
**Status:** implemented — migration `0006_dazzling_miss_america`, seeded, all quality gates green
**Last verified:** 2026-10-24

---

## 1. Role architecture

### Two scopes

| Scope | Roles | Source of truth | Typical check |
|---|---|---|---|
| **Platform** | `member` (rank 0), `moderator` (100), `admin` (200) — table-driven, extensible without code changes | `roles` + `user_platform_roles` tables | `platform:moderate`, `platform:grant_roles`, `platform:manage_content` |
| **Organization** | `viewer` (100), `editor` (200), `owner` (300) — enum in `organization_memberships.role` (stable type contract); permissions attached via `role_permissions` rows | membership row + `role_permissions` table | `org:view`, `org:edit`, `org:manage_members`, `events:create/edit/delete`, `series:manage`, `announcements:configure` |

### Adding roles/permissions without code changes

```sql
-- New permission (any scope):
INSERT INTO permissions (key, scope, description) VALUES ('events:publish', 'org', 'Publish directly');
-- Attach it to existing roles:
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.key = 'org:owner' AND p.key = 'events:publish';
```

Runtime reads the tables on next cache expiry (60s per-user / 5min per-role) — **no deploy**.
Platform roles are fully table-driven; org roles use the `org_role` enum as the typed
contract (adding a 4th org role = 1-line enum migration + seed row; permission growth
inside the 3 roles never needs code).

Seed source: `packages/core/src/permissions.ts` (`PLATFORM_ROLES`, `ORG_ROLE_PERMISSIONS`)
→ `packages/db/src/seed/rbac.ts` (idempotent, part of `pnpm db:seed`).

### Escalation guard (ranks)

- `canAssignOrgRole(actor, target)` — target rank ≤ actor rank (pure, `packages/core`).
- `canAssignPlatformRole(actorRoles, actorPermissions, targetKey)` — requires
  `platform:grant_roles` **and** target rank ≤ actor's highest rank.
- Defense-in-depth: org member management additionally requires `org:manage_members`
  (owner-only), so rank guard closes the future path where a looser permission map
  would otherwise allow self-elevation.

## 2. Database schema (migration `0006`)

```
permissions(id, key UNIQUE, scope, description)
roles(id, key UNIQUE, scope, rank, is_built_in, description)
role_permissions(role_id FK→roles, permission_id FK→permissions) PK(role_id, permission_id)
user_platform_roles(user_id FK→user_profiles, role_id FK→roles, granted_by, expires_at) PK(user_id, role_id)
authz_events(id, actor_id, action, scope, resource_type, resource_id, permission, decision, context JSONB, created_at)
```

Indexes: `authz_events(actor_id, created_at)`, `(action, created_at)`, `(created_at)`;
reverse lookup `role_permissions(permission_id)`; unique `permissions.key`, `roles.key`.
All FKs `ON DELETE cascade`. Resolution joins are (user → role → permission) — one
indexed pass; results cached one layer up (`apps/web/src/lib/authz.ts`).

## 3. Backend authorization

Layering: **db (data) → authz (decisions) → authz-guard (HTTP) → routes/pages.**

```ts
// apps/web/src/lib/authz-guard.ts — uniform protocol for all routes
const guard = await requireOrgPermission(orgId, "events:edit");
if ("error" in guard) return guard.error;   // 401 unauthenticated / 403 denied (audited)
const { user } = guard;
```

- `requireSession()` / `requirePlatformPermission(perm)` / `requireOrgPermission(orgId, perm)` / `requirePagePermission(perm)` (page redirects).
- Uniform error bodies (`{ error: "Sign in required" }` / `{ error: "Not authorized" }`) —
  responses never disclose role structure; detail lives in `authz_events`.
- Authz owns caching: per-user grants 60s TTL (invalidated on grant/revoke via `authorization.invalidate()`), role→permission map 5min TTL, membership role read-through per check (role changes take effect immediately).
- Fallback: empty DB mapping falls back to built-in `ORG_ROLE_PERMISSIONS` (deny-by-default still holds — fallback is the audited contract).
- Org membership checks call `checkOrgPermission`; synchronous fast path `checkOrgRoleSync` for already-loaded memberships.
- Legacy compat: `user_profiles.is_moderator` remains — session derives `isModerator` from `platform:moderate` and bridges pre-seed flagged users; `grantPlatformRole`/`revokePlatformRole` keep the flag in sync.
- Session: `SessionUser.permissions: string[]` carries effective platform permissions (copied from cache — never mutated in place).

**Refactor targets (tracked, not yet migrated):** the 53 pre-existing ad-hoc check sites
(`event-api.ts`, moderation, teams/members/claims APIs) — moderation + members are
covered by the new service; remaining routes keep their local checks (all still pass
through `getSessionUser`, which now carries permissions).

## 4. Frontend access control

```tsx
<CanPlatform user={user} permission="platform:moderate"><Link href="/moderation">…</Link></CanPlatform>
<CanOrg role={membership?.role} permission="events:create"><EventCreateButton /></CanOrg>
```

- `apps/web/src/components/permission-gate.tsx` — declarative gates, server- and client-compatible.
- Shipped example: Moderation nav link (desktop + mobile) renders only for `platform:moderate`.
- **Server is source of truth**: gates are UX only; every route/API re-enforces via
  `authz-guard.ts`. Hiding a button never grants access.

## 5. Security & compliance

| Threat | Control |
|---|---|
| Privilege escalation | Rank guards (`canAssignOrgRole`/`canAssignPlatformRole`) on every role mutation + `org:manage_members` gate; denial audited with `escalation_blocked` reason |
| Silent role changes | POST/PATCH/DELETE on members write `role.granted`/`role.changed`/`role.revoked` audit rows with actor, target, previous role (previously: zero audit) |
| Invisible probing | Every failed `require*` check writes `access.denied` (incl. anonymous, `actor_id NULL`) |
| Role enumeration via errors | Uniform 401/403 bodies — no role names in responses |
| Grant stickiness | `expires_at` on platform grants; `invalidate()` on mutation for immediate revocation; `is_moderator` kept in sync on revoke (recomputed, not blindly cleared) |
| Cache poisoning | Session copies cached permission arrays before mutation |
| Audit loss masking actions | `recordAuthzEvent` never throws — audit failure cannot flip a decision |

## 6. Testing strategy

| Layer | File | Coverage |
|---|---|---|
| Pure escalation guards | `packages/core/src/permissions.test.ts` (60 tests total) | rank ordering, org assignment matrix (owner/editor/viewer ×3), platform rank ceiling, no-`grant_roles` → no grants, seed map invariants (viewer⊆owner) |
| Authz service | `apps/web/src/lib/authz.test.ts` | allow path (no audit noise), deny path (audit row shape), unauthenticated, org no-membership / lacking-role / DB-fallback, cache hit-miss-TTL-invalidate, metrics counters, role-change + escalation denial audit shape |
| Live DB | seed idempotency (`pnpm db:seed` re-run), `drizzle-kit check` (CI gate) | migration ↔ snapshot consistency |

Key escalation scenarios proven: editor→owner blocked, viewer→any-above blocked,
moderator-without-`grant_roles` blocked, moderator→admin blocked by rank ceiling.

## 7. Monitoring & audit

- **Durable:** `authz_events` append-only (actor, action, scope, permission, decision, context JSONB) — indexed for actor/action/time queries.
- **Process metrics:** `authorization.getMetrics()` → checks, denials, cache hits/misses, denials-by-permission.
- **Endpoint:** `GET /api/authz/metrics` (gated `platform:moderate`) returns process metrics + 24h `access.denied`/`role.granted` counts from the DB.
- Alerting hooks: spike in `access.denied` for one actor = probing; any `escalation_blocked` row = attempted self-elevation.

## 8. Deployment checklist

- [ ] **Migrate:** `pnpm db:migrate` (fresh environments replay `0000→0006`; *see known issue below*).
- [ ] **Seed:** `pnpm db:seed` — inserts permissions/roles/role_permissions + bridges `is_moderator` → `platform:moderator` grants. Re-run safe.
- [ ] **Verify:**
  ```sql
  SELECT count(*) FROM permissions;              -- expect ≥ 11
  SELECT count(*) FROM roles;                    -- expect 6
  SELECT r.key, count(rp.permission_id) FROM roles r
    LEFT JOIN role_permissions rp ON rp.role_id = r.id GROUP BY r.key;
  SELECT * FROM user_platform_roles WHERE granted_by IS NOT NULL; -- manual grants
  ```
- [ ] **Smoke:** anonymous `GET /api/authz/metrics` → 401; authenticated moderator → 200;
      anonymous nav shows no Moderation link; role change in members API → row in `authz_events`.
- [ ] **Gates:** `pnpm check` + `drizzle-kit check` (CI runs both).
- [ ] **Rollback:** migration is additive-only (5 tables + indexes) — `DROP TABLE authz_events, user_platform_roles, role_permissions, roles, permissions; DROP TYPE rbac_scope;` restores previous state; code falls back to `is_moderator` + core permission map if tables are absent (role loader returns `[]` → core fallback).
- [ ] **Rotating platform roles:** use `grantPlatformRole`/`revokePlatformRole` (`@utah-esports/db`) — never `UPDATE user_profiles SET is_moderator` directly (bypasses audit + grant table).

### Known issue — migration history on pre-existing local DBs

`drizzle.__drizzle_migrations` is empty on databases created before migration history
was tracked (schema applied via `drizzle-kit push`), so `pnpm db:migrate` restarts at
`0000` and fails on existing objects. Workaround applied for this rollout: `0006` was
applied directly via `psql`. **Fresh environments (production, CI) replay cleanly from
`0000`.** If local `db:migrate` fails: apply the newest `migrations/*.sql` via psql, or
reset the dev DB (`docker compose down -v && pnpm db:migrate && pnpm db:seed`).
