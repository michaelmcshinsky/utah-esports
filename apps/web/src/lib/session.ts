import type { User } from "@supabase/supabase-js";
import { getMembershipsForUser } from "@utah-esports/db";
import type { Membership } from "@utah-esports/core";
import { authorization } from "./authz.js";
import { db } from "./db.js";
import { createSupabaseServerClient, supabaseServerConfigured } from "./supabase/server.js";

export type SessionUser = {
  id: string;
  email: string;
  /** @deprecated Derived from `permissions`; kept for existing call sites. */
  isModerator: boolean;
  /** Effective platform permission keys (RBAC tables, cached). */
  permissions: string[];
};

export async function getSessionUser(): Promise<SessionUser | null> {
  if (!supabaseServerConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return loadSessionUser(user);
}

async function loadSessionUser(user: User): Promise<SessionUser> {
  const database = db();
  const { userProfiles } = await import("@utah-esports/db");
  const { eq } = await import("drizzle-orm");
  let [profile] = await database
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, user.id))
    .limit(1);
  if (!profile) {
    const email = user.email ?? "";
    const [created] = await database
      .insert(userProfiles)
      .values({ id: user.id, email })
      .onConflictDoNothing()
      .returning();
    profile = created;
    if (!profile) {
      // Concurrent insert — re-read the row that won the race.
      [profile] = await database
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.id, user.id))
        .limit(1);
    }
    if (!profile) return { id: user.id, email, isModerator: false, permissions: [] };
  }

  // Copy before mutating: the service returns the cached array by reference.
  const permissions = [...(await authorization.getPlatformPermissions(user.id))];
  // Legacy bridge: profiles flagged is_moderator before the RBAC tables were
  // seeded keep access until `seedRbac()` writes their grant rows.
  if (profile.isModerator && !permissions.includes("platform:moderate")) {
    permissions.push("platform:moderate");
  }
  return {
    id: profile.id,
    email: profile.email,
    isModerator: permissions.includes("platform:moderate"),
    permissions,
  };
}

export async function getOrgMemberships(userId: string): Promise<Membership[]> {
  const rows = await getMembershipsForUser(db(), userId);
  return rows.map((m) => ({ orgId: m.orgId, role: m.role }));
}
