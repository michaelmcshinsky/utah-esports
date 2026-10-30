import { desc, eq, inArray, sql } from "drizzle-orm";
import {
  games,
  venues,
  eventOccurrences,
  getEventGames,
  listUpcomingEvents,
  listCommunities,
} from "@utah-esports/db";
import { db } from "@/src/lib/db";

export type UpcomingEventRow = {
  id: string;
  slug: string;
  title: string;
  gameNames: string[];
  imageUrl: string | null;
  startsAt: Date;
  endsAt: Date | null;
  format: string;
  eventType: string;
  city: string | null;
  priceCents: number | null;
  priceNote: string | null;
  venueFeeCents: number | null;
  agePolicy: string | null;
  beginnerFriendly: boolean | null;
  youthProgram: boolean | null;
  registrationState: string | null;
  registrationDeadline: Date | null;
  status: string;
  statusNotice: string | null;
  lastConfirmedAt: Date | null;
  registrationUrl: string | null;
};

export async function getUpcomingEvents(limit = 6, state?: string): Promise<UpcomingEventRow[]> {
  const database = db();
  const events = await listUpcomingEvents(database, limit, { state });
  const rows: UpcomingEventRow[] = [];
  for (const event of events) {
    const gameRows = await getEventGames(database, event.id);
    rows.push({
      id: event.id,
      slug: event.slug,
      title: event.title,
      gameNames: gameRows.map((g) => g.game.name),
      imageUrl: event.imageUrl,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      format: event.format,
      eventType: event.eventType,
      city: event.city,
      priceCents: event.priceCents,
      priceNote: event.priceNote,
      venueFeeCents: event.venueFeeCents,
      agePolicy: event.agePolicy,
      beginnerFriendly: event.beginnerFriendly,
      youthProgram: event.youthProgram,
      registrationState: event.registrationState,
      registrationDeadline: event.registrationDeadline,
      status: event.status,
      statusNotice: event.statusNotice,
      lastConfirmedAt: event.lastConfirmedAt,
      registrationUrl: event.registrationUrl,
    });
  }
  return rows;
}

export async function getPopularGames() {
  return db()
    .select()
    .from(games)
    .where(
      inArray(games.slug, [
        "super-smash-brothers-ultimate",
        "super-smash-brothers-melee",
        "rocket-league",
        "valorant",
        "league-of-legends",
        "street-fighter-6",
        "marvel-rivals",
        "apex-legends",
      ]),
    )
    .orderBy(desc(games.name))
    .limit(8);
}

export async function getAllCommunities(state?: string) {
  return listCommunities(db(), { state });
}

export async function getStats(state?: string) {
  const database = db();
  const weekOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [eventsThisWeek] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(eventOccurrences)
    .where(
      sql`(${eventOccurrences.status} = 'published' OR ${eventOccurrences.status} = 'needs_verification')
          AND ${eventOccurrences.startsAt} >= now()
          AND ${eventOccurrences.startsAt} <= ${weekOut}
          ${state ? sql`AND ${eventOccurrences.state} = ${state}` : sql``}`,
    );
  const [venueCount] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(venues)
    .where(state ? eq(venues.state, state) : undefined);
  const [gameCount] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(games);
  return {
    eventsThisWeek: eventsThisWeek?.count ?? 0,
    venues: venueCount?.count ?? 0,
    games: gameCount?.count ?? 0,
  };
}
