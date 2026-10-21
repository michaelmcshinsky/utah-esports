import { asc, eq, inArray } from "drizzle-orm";
import {
  digestSends,
  eventGames,
  eventOccurrences,
  games,
  userPreferences,
  userProfiles,
  getDb,
} from "@utah-esports/db";
import { createTransport, renderWeeklyDigest } from "@utah-esports/email";
import { log } from "../lib/logger.js";

/**
 * Weekly digest built strictly from real upcoming listings.
 * Cancelled events are never included; deduplicated per user+week.
 */
export async function runWeeklyDigest(now = new Date()): Promise<{ sent: number }> {
  const db = getDb();
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  const daysSinceMonday = (today.getDay() + 6) % 7;
  const weekOf = new Date(today);
  weekOf.setDate(today.getDate() - daysSinceMonday);

  const allPrefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.digestEnabled, true));
  const due = allPrefs.filter((p) => p.digestDayOfWeek === now.getDay());

  const transport = createTransport();
  let sent = 0;

  const upcoming = await db
    .select()
    .from(eventOccurrences)
    .where(inArray(eventOccurrences.status, ["published", "needs_verification"]))
    .orderBy(asc(eventOccurrences.startsAt))
    .limit(300);

  for (const pref of due) {
    const weekRows = await db.select().from(digestSends).where(eq(digestSends.weekOf, weekOf));
    if (weekRows.some((d) => d.userId === pref.userId)) continue;

    const digestEvents = [];
    for (const event of upcoming) {
      if (event.startsAt < now) continue;
      if (pref.city && event.city && !event.city.toLowerCase().includes(pref.city.toLowerCase())) {
        continue;
      }
      const gameRows = await db
        .select({ game: games })
        .from(eventGames)
        .innerJoin(games, eq(eventGames.gameId, games.id))
        .where(eq(eventGames.eventId, event.id));
      if (
        pref.gameSlugs.length > 0 &&
        !gameRows.some((g) => pref.gameSlugs.includes(g.game.slug))
      ) {
        continue;
      }
      digestEvents.push({
        title: event.title,
        url: `https://utahesports.net/events/${event.slug}`,
        whenLabel: event.startsAt.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        city: event.city,
        gameNames: gameRows.map((g) => g.game.name),
      });
      if (digestEvents.length >= 12) break;
    }

    if (digestEvents.length === 0) continue;

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, pref.userId))
      .limit(1);
    if (!profile) continue;

    const message = renderWeeklyDigest({
      name: pref.displayName,
      events: digestEvents,
      siteUrl: "https://utahesports.net",
    });
    try {
      await transport.send({ ...message, to: profile.email });
      await db.insert(digestSends).values({
        userId: pref.userId,
        weekOf,
        eventCount: digestEvents.length,
        status: "sent",
      });
      sent++;
    } catch (err) {
      log("error", "weekly-digest", "send failed", {
        userId: pref.userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  log("info", "weekly-digest", "complete", { sent });
  return { sent };
}
