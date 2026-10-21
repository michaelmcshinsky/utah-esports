import { NextResponse } from "next/server";
import { parseFilters, serializeFilters } from "@utah-esports/core";
import { getEventGames, searchEvents } from "@utah-esports/db";
import { db } from "@/src/lib/db";

/** JSON discovery API — same filter system as /explore. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const filter = parseFilters(url.searchParams);
  const database = db();
  const result = await searchEvents(database, filter);
  const items = await Promise.all(
    result.items.map(async (event) => {
      const games = await getEventGames(database, event.id);
      return {
        id: event.id,
        slug: event.slug,
        title: event.title,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt?.toISOString() ?? null,
        format: event.format,
        eventType: event.eventType,
        city: event.city,
        region: event.region,
        agePolicy: event.agePolicy,
        beginnerFriendly: event.beginnerFriendly,
        youthProgram: event.youthProgram,
        priceCents: event.priceCents,
        registrationState: event.registrationState,
        status: event.status,
        registrationUrl: event.registrationUrl,
        games: games.map((g) => ({ slug: g.game.slug, name: g.game.name })),
        url: `/events/${event.slug}`,
      };
    }),
  );
  return NextResponse.json({
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    filter: serializeFilters(filter),
    items,
  });
}
