import type { User } from "@supabase/supabase-js";
import { getMembershipsForUser } from "@utah-esports/db";
import type { Membership } from "@utah-esports/core";
import { db } from "./db.js";
import { createSupabaseServerClient, supabaseServerConfigured } from "./supabase/server.js";

export type SessionUser = {
  id: string;
  email: string;
  isModerator: boolean;
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
  const [profile] = await database
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
    return {
      id: user.id,
      email,
      isModerator: created?.isModerator ?? false,
    };
  }
  return { id: profile.id, email: profile.email, isModerator: profile.isModerator };
}

export async function getOrgMemberships(userId: string): Promise<Membership[]> {
  const rows = await getMembershipsForUser(db(), userId);
  return rows.map((m) => ({ orgId: m.orgId, role: m.role }));
}
