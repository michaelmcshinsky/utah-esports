import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { userPreferences } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";
import { PreferencesForm, type PreferencesDefaults } from "./preferences-form";
import { listGamesSafe } from "./preferences-data";

export const metadata: Metadata = { title: "Preferences" };
export const revalidate = 0;

export default async function PreferencesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const database = db();
  const prefs = await database
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, user.id))
    .limit(1);
  const games = await listGamesSafe(database);
  const current = prefs[0];

  const defaults: PreferencesDefaults = {
    displayName: current?.displayName ?? null,
    city: current?.city ?? null,
    radiusKm: current?.radiusKm ?? 40,
    digestDayOfWeek: current?.digestDayOfWeek ?? 1,
    digestEnabled: current?.digestEnabled ?? true,
    reminderEnabled: current?.reminderEnabled ?? true,
    changeNotificationsEnabled: current?.changeNotificationsEnabled ?? true,
    gameSlugs: current?.gameSlugs ?? [],
  };

  return (
    <div className="page-container py-8">
      <h1 className="font-display text-3xl font-bold">Preferences</h1>
      <p className="mt-1 text-sm text-charcoal-600">
        Drive digests, reminders, and “this weekend” views. Stored only for you — no public
        profile.{" "}
        <Link href="/account" className="text-redrock-600 hover:underline">
          ← Back to account
        </Link>
      </p>
      <PreferencesForm
        defaults={defaults}
        games={games.map((g) => ({ id: g.id, slug: g.slug, name: g.name }))}
      />
    </div>
  );
}
