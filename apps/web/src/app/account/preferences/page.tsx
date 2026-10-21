import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Button, Input, Select, Checkbox } from "@utah-esports/ui";
import { userPreferences, listGamesSafe } from "./preferences-data";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";
import { savePreferences } from "./actions";

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

  return (
    <div className="page-container py-8">
      <h1 className="font-display text-3xl font-bold">Preferences</h1>
      <p className="mt-1 text-sm text-charcoal-600">
        Drive digests, reminders, and “this weekend” views. Stored only for you — no public
        profile.
      </p>
      <form action={savePreferences} className="mt-8 max-w-xl space-y-4">
        <Input label="Display name" name="displayName" defaultValue={current?.displayName ?? ""} />
        <Input label="Home city" name="city" defaultValue={current?.city ?? ""} hint="Used for nearby defaults" />
        <Input
          label="Search radius (km)"
          name="radiusKm"
          type="number"
          min={1}
          max={400}
          defaultValue={current?.radiusKm ?? 40}
        />
        <Select
          label="Weekly digest day"
          name="digestDayOfWeek"
          defaultValue={String(current?.digestDayOfWeek ?? 1)}
          options={[
            { value: "0", label: "Sunday" },
            { value: "1", label: "Monday" },
            { value: "2", label: "Tuesday" },
            { value: "3", label: "Wednesday" },
            { value: "4", label: "Thursday" },
            { value: "5", label: "Friday" },
            { value: "6", label: "Saturday" },
          ]}
        />
        <Checkbox
          label="Weekly digest email"
          name="digestEnabled"
          defaultChecked={current?.digestEnabled ?? true}
        />
        <Checkbox
          label="Registration deadline reminders"
          name="reminderEnabled"
          defaultChecked={current?.reminderEnabled ?? true}
        />
        <Checkbox
          label="Notify me when saved events change"
          name="changeNotificationsEnabled"
          defaultChecked={current?.changeNotificationsEnabled ?? true}
        />
        {games.length > 0 ? (
          <fieldset className="rounded-card border border-charcoal-200 bg-white p-4">
            <legend className="px-1 text-sm font-medium text-charcoal-800">Games I follow</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {games.slice(0, 16).map((game) => (
                <Checkbox
                  key={game.id}
                  label={game.name}
                  name={`game:${game.slug}`}
                  defaultChecked={current?.gameSlugs?.includes(game.slug) ?? false}
                />
              ))}
            </div>
          </fieldset>
        ) : null}
        <Button type="submit">Save preferences</Button>
      </form>
    </div>
  );
}
