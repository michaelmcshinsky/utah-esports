"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { follows, games, userPreferences } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

/**
 * Save preferences AND keep `follows` (kind=game) in sync with the followed
 * games list — one control feeds both the digest job (gameSlugs) and the
 * change-notification job (follows).
 */
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

  // Sync followed games: remove unfollowed, add newly followed.
  const allGames = await database.select().from(games);
  const wantedIds = new Set(
    allGames.filter((g) => gameSlugs.includes(g.slug)).map((g) => g.id),
  );
  const existing = await database.select().from(follows).where(eq(follows.userId, user.id));
  const existingGameIds = new Set(
    existing.filter((f) => f.kind === "game").map((f) => f.targetId),
  );
  for (const gameId of existingGameIds) {
    if (!wantedIds.has(gameId)) {
      await database
        .delete(follows)
        .where(eq(follows.id, existing.find((f) => f.kind === "game" && f.targetId === gameId)!.id));
    }
  }
  for (const gameId of wantedIds) {
    if (!existingGameIds.has(gameId)) {
      await database
        .insert(follows)
        .values({ userId: user.id, kind: "game", targetId: gameId })
        .onConflictDoNothing();
    }
  }

  revalidatePath("/account/preferences");
}
