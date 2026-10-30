import { desc, eq } from "drizzle-orm";
import { roles, userPlatformRoles, userProfiles } from "@utah-esports/db";
import { PLATFORM_ROLES } from "@utah-esports/core";
import { db } from "@/src/lib/db";
import { setUserRole } from "../actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin · Users", robots: { index: false } };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const ok = typeof params.ok === "string" ? params.ok : null;

  // Platform roles are global — one grant covers every state app.
  const [users, roleRows] = await Promise.all([
    db()
      .select({
        id: userProfiles.id,
        email: userProfiles.email,
        displayName: userProfiles.displayName,
        createdAt: userProfiles.createdAt,
      })
      .from(userProfiles)
      .orderBy(desc(userProfiles.createdAt))
      .limit(100),
    db()
      .select({
        userId: userPlatformRoles.userId,
        roleId: userPlatformRoles.roleId,
        roleName: roles.key,
        grantedBy: userPlatformRoles.grantedBy,
        expiresAt: userPlatformRoles.expiresAt,
      })
      .from(userPlatformRoles)
      .innerJoin(roles, eq(userPlatformRoles.roleId, roles.id)),
  ]);

  const rolesByUser = new Map<string, Array<{ roleId: string; roleName: string }>>();
  for (const r of roleRows) {
    const list = rolesByUser.get(r.userId) ?? [];
    list.push({ roleId: r.roleId, roleName: r.roleName });
    rolesByUser.set(r.userId, list);
  }

  return (
    <div className="page-container py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-charcoal-900">Users</h1>
        <p className="mt-1 text-sm text-charcoal-600">
          Platform roles are global: a moderator or admin mod every state app. Org roles are
          managed from the organizer dashboard. Grants require `platform:grant_roles` and are rank-
          guarded — you cannot grant above your own rank (escalation attempts are audited).
        </p>
      </div>

      {error ? (
        <p role="status" className="rounded-lg bg-danger-100 px-4 py-2 text-sm font-medium text-danger-600">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p role="status" className="rounded-lg bg-success-100 px-4 py-2 text-sm font-medium text-success-700">
          {ok}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-card border border-charcoal-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-charcoal-200 text-left text-xs uppercase tracking-wide text-charcoal-500">
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Platform roles</th>
              <th className="px-4 py-3">Grant / revoke</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const granted = rolesByUser.get(u.id) ?? [];
              return (
                <tr key={u.id} className="border-b border-charcoal-100 last:border-0 align-top">
                  <td className="px-4 py-3 font-medium text-charcoal-900">{u.email}</td>
                  <td className="px-4 py-3 text-charcoal-600">{u.displayName ?? "—"}</td>
                  <td className="px-4 py-3">
                    {granted.length === 0 ? (
                      <span className="text-charcoal-500">member</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {granted.map((r) => (
                          <span
                            key={r.roleId}
                            className="rounded-full bg-charcoal-100 px-2 py-0.5 text-xs font-semibold text-charcoal-700"
                          >
                            {r.roleName}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <form action={setUserRole} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="userId" value={u.id} />
                      <select
                        name="roleKey"
                        defaultValue=""
                        className="rounded-lg border border-charcoal-300 bg-white px-2 py-1.5 text-xs"
                        aria-label={`Role for ${u.email}`}
                      >
                        {PLATFORM_ROLES.map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.key} (rank {r.rank})
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        name="mode"
                        value="grant"
                        className="rounded-lg bg-pine-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pine-600"
                      >
                        Grant
                      </button>
                      <button
                        type="submit"
                        name="mode"
                        value="revoke"
                        className="rounded-lg bg-charcoal-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-charcoal-700"
                      >
                        Revoke
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-charcoal-500">
                  No user profiles recorded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
