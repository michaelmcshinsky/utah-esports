import { eq } from "drizzle-orm";
import {
  digestSends,
  eventGames,
  games,
  searchEvents,
  userPreferences,
  userProfiles,
  getDb,
} from "@utah-esports/db";
import { parseFilters } from "@utah-esports/core";
import { createTransport, renderWeeklyDigest } from "@utah-esports/email";
import { log } from "../lib/logger.js";

/**
 * Weekly digest built strictly from real upcoming listings, matched with
 * the same filter system as /explore (city + radius + games) — an email
 * can never invent or drop events the site would show. Cancelled events
 * are never included; deduplicated per user+week.
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

  for (const pref of due) {
    const weekRows = await db.select().from(digestSends).where(eq(digestSends.weekOf, weekOf));
    if (weekRows.some((d) => d.userId === pref.userId)) continue;

    // Shared filter system: city text + radius + game slugs from prefs.
    const filter = parseFilters({
      ...(pref.city ? { city: pref.city, radiusKm: String(pref.radiusKm) } : {}),
      ...(pref.gameSlugs.length ? { games: pref.gameSlugs.join(",") } : {}),
      sort: "soonest",
      pageSize: "12",
    });
    const result = await searchEvents(db, filter);

    const digestEvents = [];
    for (const event of result.items) {
      const gameRows = await db
        .select({ game: games })
        .from(eventGames)
        .innerJoin(games, eq(eventGames.gameId, games.id))
        .where(eq(eventGames.eventId, event.id));
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
