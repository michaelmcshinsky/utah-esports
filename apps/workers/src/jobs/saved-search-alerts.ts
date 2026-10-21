import { and, eq, isNull, lt, or } from "drizzle-orm";
import {
  eventGames,
  games,
  savedSearches,
  searchEvents,
  userPreferences,
  userProfiles,
  getDb,
} from "@utah-esports/db";
import { parseFilters, type EventSearchFilter } from "@utah-esports/core";
import { createTransport, renderSavedSearchAlert, type DigestEvent } from "@utah-esports/email";
import { log } from "../lib/logger.js";

/**
 * Saved-search alerts: when new events (created since the last notification)
 * match a user's saved search, send one alert. Matches are produced by the
 * same filter system as the site — an alert can never invent an event.
 */
export async function runSavedSearchAlerts(now = new Date()): Promise<{ sent: number }> {
  const db = getDb();
  const searches = await db
    .select()
    .from(savedSearches)
    .where(and(eq(savedSearches.notify, true), or(isNull(savedSearches.lastNotifiedAt), lt(savedSearches.lastNotifiedAt, new Date(now.getTime() - 20 * 60 * 60 * 1000)))))
    .limit(200);

  const transport = createTransport();
  let sent = 0;

  for (const saved of searches) {
    const since =
      saved.lastNotifiedAt ??
      new Date(Math.max(saved.createdAt.getTime(), now.getTime() - 7 * 24 * 60 * 60 * 1000));
    const filter: EventSearchFilter = parseFilters(
      new URLSearchParams(saved.query),
    );
    const result = await searchEvents(db, { ...filter, pageSize: 25, sort: "recently_added" });
    const freshRows = result.items.filter((event) => event.createdAt > since);
    if (freshRows.length === 0) continue;

    const [pref] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, saved.userId))
      .limit(1);
    if (pref && !pref.digestEnabled) continue;
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, saved.userId))
      .limit(1);
    if (!profile) continue;

    const events: DigestEvent[] = [];
    for (const event of freshRows.slice(0, 10)) {
      const gameRows = await db
        .select({ game: games })
        .from(eventGames)
        .innerJoin(games, eq(eventGames.gameId, games.id))
        .where(eq(eventGames.eventId, event.id));
      events.push({
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

    const message = renderSavedSearchAlert({
      name: pref?.displayName ?? null,
      searchName: saved.name,
      events,
      siteUrl: "https://utahesports.net",
    });
    try {
      await transport.send({ ...message, to: profile.email });
      await db
        .update(savedSearches)
        .set({ lastNotifiedAt: now, updatedAt: new Date() })
        .where(eq(savedSearches.id, saved.id));
      sent++;
    } catch (err) {
      log("error", "saved-search-alerts", "send failed", {
        searchId: saved.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  log("info", "saved-search-alerts", "complete", { sent });
  return { sent };
}
