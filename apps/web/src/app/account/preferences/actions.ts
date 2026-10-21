"use server";

import { revalidatePath } from "next/cache";
import { userPreferences } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

export async function savePreferences(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) return;
  const gameSlugs: string[] = [];
  for (const key of formData.keys()) {
    if (key.startsWith("game:")) {
      gameSlugs.push(key.slice(5));
    }
  }
  const values = {
    userId: user.id,
    displayName: (formData.get("displayName") as string) || null,
    city: (formData.get("city") as string) || null,
    radiusKm: Number(formData.get("radiusKm") ?? 40) || 40,
    digestDayOfWeek: Number(formData.get("digestDayOfWeek") ?? 1),
    digestEnabled: formData.get("digestEnabled") === "on",
    reminderEnabled: formData.get("reminderEnabled") === "on",
    changeNotificationsEnabled: formData.get("changeNotificationsEnabled") === "on",
    gameSlugs,
  };
  const database = db();
  await database
    .insert(userPreferences)
    .values(values)
    .onConflictDoUpdate({ target: userPreferences.userId, set: values });
  revalidatePath("/account/preferences");
}
