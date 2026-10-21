import Link from "next/link";
import { Suspense } from "react";
import { inArray, desc } from "drizzle-orm";
import { EventCard, type EventCardModel } from "@utah-esports/ui";
import { games, listUpcomingEvents, getEventGames, listCommunities } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { SearchHero } from "@/src/components/search-hero";

export const dynamic = "force-dynamic";

async function getHomeEvents(): Promise<EventCardModel[]> {
  const database = db();
  const events = await listUpcomingEvents(database, 6);
  const cards: EventCardModel[] = [];
  for (const event of events) {
    const eventGamesRows = await getEventGames(database, event.id);
    cards.push({
      id: event.id,
      slug: event.slug,
      title: event.title,
      gameNames: eventGamesRows.map((g) => g.game.name),
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      format: event.format,
      eventType: event.eventType,
      city: event.city,
      venueName: null,
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
      sourceLabel: "Utah Esports",
      registrationUrl: event.registrationUrl,
    });
  }
  return cards;
}

async function getPopularGames() {
  return db()
    .select()
    .from(games)
    .where(inArray(games.slug, [
      "super-smash-brothers-ultimate",
      "super-smash-brothers-melee",
      "rocket-league",
      "valorant",
      "league-of-legends",
      "street-fighter-6",
      "marvel-rivals",
      "apex-legends",
    ]))
    .orderBy(desc(games.name))
    .limit(8);
}

export default async function HomePage() {
  const [events, gameRows, communityRows] = await Promise.all([
    getHomeEvents(),
    getPopularGames(),
    listCommunities(db(), {}),
  ]);

  return (
    <>
      <section className="topo-background bg-charcoal-900 text-sandstone-50">
        <div className="page-container py-14 sm:py-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-redrock-200">
            Utah&apos;s gaming home base
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-bold sm:text-5xl">
            Find your next game in Utah.
          </h1>
          <p className="mt-3 max-w-xl text-base text-charcoal-300 sm:text-lg">
            Tournaments, casual meetups, communities, teams, and places to play — kept current by
            the people who run them.
          </p>
          <Suspense fallback={<div className="h-[124px] rounded-card bg-charcoal-800/50" />}>
            <SearchHero className="mt-8" />
          </Suspense>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {[
              { label: "This weekend", href: "/explore?preset=weekend" },
              { label: "Beginner-friendly", href: "/explore?beginnerOnly=true" },
              { label: "Free", href: "/explore?freeOnly=true" },
              { label: "Youth programs", href: "/explore?youthOnly=true" },
              { label: "Online", href: "/explore?formats=online" },
            ].map((chip) => (
              <Link
                key={chip.href}
                href={chip.href}
                className="rounded-full border border-charcoal-600 px-3 py-1 text-charcoal-200 hover:border-redrock-400 hover:text-white"
              >
                {chip.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container py-12" aria-labelledby="happening-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="happening-heading" className="section-heading">
              Happening near you
            </h2>
            <p className="mt-1 text-sm text-charcoal-600">
              Upcoming events across Utah — every card shows when, where, and what it takes to
              join.
            </p>
          </div>
          <Link href="/explore" className="shrink-0 text-sm font-medium text-redrock-600 hover:text-redrock-700">
            View all events →
          </Link>
        </div>
        {events.length === 0 ? (
          <div className="mt-6 rounded-card border border-dashed border-charcoal-300 bg-white px-6 py-12 text-center">
            <p className="font-medium text-charcoal-800">No upcoming events listed yet.</p>
            <p className="mt-1 text-sm text-charcoal-600">
              Know about one?{" "}
              <Link href="/submit" className="font-medium text-redrock-600 hover:underline">
                Submit an event
              </Link>{" "}
              or check online options.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Link
                href="/explore?formats=online"
                className="rounded-lg border border-charcoal-300 px-4 py-2 text-sm font-medium hover:bg-sandstone-100"
              >
                Browse online events
              </Link>
              <Link
                href="/communities"
                className="rounded-lg bg-charcoal-900 px-4 py-2 text-sm font-medium text-white hover:bg-charcoal-800"
              >
                Find a community
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-charcoal-200 bg-white py-12" aria-labelledby="games-heading">
        <div className="page-container">
          <h2 id="games-heading" className="section-heading">
            Find your community
          </h2>
          <p className="mt-1 text-sm text-charcoal-600">
            Utah gathers around these games. Pick yours to see communities and events.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {gameRows.map((game) => (
              <Link
                key={game.id}
                href={`/communities?game=${game.slug}`}
                className="rounded-xl border border-charcoal-200 bg-sandstone-50 px-4 py-2.5 text-sm font-medium text-charcoal-800 hover:border-redrock-400 hover:bg-redrock-50"
              >
                {game.name}
              </Link>
            ))}
            <Link
              href="/communities"
              className="rounded-xl border border-dashed border-charcoal-300 px-4 py-2.5 text-sm font-medium text-charcoal-600 hover:border-charcoal-400"
            >
              More games →
            </Link>
          </div>
        </div>
      </section>

      <section className="page-container py-12" aria-labelledby="new-heading">
        <div className="rounded-card topo-background bg-charcoal-900 px-6 py-10 text-sandstone-50 sm:px-10">
          <h2 id="new-heading" className="font-display text-2xl font-bold">
            New to the scene?
          </h2>
          <p className="mt-2 max-w-xl text-charcoal-300">
            You don&apos;t need a team or a ranking to start. Beginner-friendly meetups, casual
            sessions, and school programs are the easiest way in.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/explore?beginnerOnly=true"
              className="rounded-lg bg-redrock-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-redrock-600"
            >
              Find your first event
            </Link>
            <Link
              href="/communities"
              className="rounded-lg border border-charcoal-600 px-4 py-2.5 text-sm font-semibold text-charcoal-100 hover:bg-charcoal-800"
            >
              Find a community
            </Link>
            <Link
              href="/schools"
              className="rounded-lg border border-charcoal-600 px-4 py-2.5 text-sm font-semibold text-charcoal-100 hover:bg-charcoal-800"
            >
              Explore school programs
            </Link>
          </div>
        </div>
      </section>

      <section className="page-container pb-16" aria-labelledby="organizer-heading">
        <div className="flex flex-col gap-4 rounded-card border border-charcoal-200 bg-white px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="organizer-heading" className="text-xl font-semibold text-charcoal-900">
              Run something local?
            </h2>
            <p className="mt-1 text-sm text-charcoal-600">
              Publish once — keep players updated everywhere. Claim your org, add events, and
              announce to Discord from one place.{" "}
              {communityRows.length > 0
                ? `${communityRows.length} communities are already listed.`
                : null}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/submit"
              className="rounded-lg bg-redrock-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-redrock-600"
            >
              Add an event
            </Link>
            <Link
              href="/organizers"
              className="rounded-lg border border-charcoal-300 px-4 py-2.5 text-sm font-semibold text-charcoal-800 hover:bg-sandstone-50"
            >
              Claim your organization
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
