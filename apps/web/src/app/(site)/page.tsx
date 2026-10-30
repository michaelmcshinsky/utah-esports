import Link from "next/link";
import { Suspense } from "react";
import { desc, inArray, sql } from "drizzle-orm";
import { EventCard, type EventCardModel } from "@utah-esports/ui";
import {
  games,
  venues,
  eventOccurrences,
  listUpcomingEvents,
  getEventGames,
  listCommunities,
} from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { SearchHero } from "@/src/components/search-hero";
import { WebsiteJsonLd } from "@/src/components/seo/website-json-ld";

export const dynamic = "force-dynamic";

export const metadata = {
  alternates: { canonical: "/" },
};

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
      imageUrl: event.imageUrl,
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

async function getStats() {
  const database = db();
  const weekOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [eventsThisWeek] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(eventOccurrences)
    .where(
      sql`(${eventOccurrences.status} = 'published' OR ${eventOccurrences.status} = 'needs_verification')
          AND ${eventOccurrences.startsAt} >= now()
          AND ${eventOccurrences.startsAt} <= ${weekOut}`,
    );
  const [venueCount] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(venues);
  const [gameCount] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(games);
  return {
    eventsThisWeek: eventsThisWeek?.count ?? 0,
    venues: venueCount?.count ?? 0,
    games: gameCount?.count ?? 0,
  };
}

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Search what's near you",
    body: "Filter by game, date, city, skill level, age rules, and price. List, calendar, and map views share one search — your filters live in the URL, so sharing a result shares exactly what you saw.",
  },
  {
    step: "02",
    title: "Know before you go",
    body: "Every listing answers the real questions up front: when it starts, where it is (or that it's online), what it costs, who can enter, and how to register — plus when we last checked the details.",
  },
  {
    step: "03",
    title: "Show up and play",
    body: "Registration stays on the organizer's own platform; we link you straight there and track nothing beyond the click. Save what looks good, follow your scenes, and get a heads-up when things change.",
  },
] as const;

export default async function HomePage() {
  const [events, gameRows, communityRows, stats] = await Promise.all([
    getHomeEvents(),
    getPopularGames(),
    listCommunities(db(), {}),
    getStats(),
  ]);

  return (
    <>
      <WebsiteJsonLd />
      {/* Hero — Royal Tickets style banner */}
      <section
        className="hero-section text-white"
        style={{
          backgroundImage: "url('/images/home/utah-esports-banner-2.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="page-container py-20 sm:py-28 lg:py-32">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold-400">
            Utah&apos;s gaming home base
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Find your next game in Utah.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-charcoal-200 sm:text-xl">
            Tournaments, casual meetups, communities, teams, and places to play — from Salt Lake
            arcades to Provo LANs to Logan campus clubs — kept current by the people who run them.
          </p>
          <Suspense fallback={<div className="h-[124px] rounded-lg bg-charcoal-800/50" />}>
            <SearchHero className="mt-8" />
          </Suspense>
          <div className="mt-5 flex flex-wrap gap-2 text-sm">
            {[
              { label: "This weekend", href: "/events?preset=weekend" },
              { label: "Beginner-friendly", href: "/events?beginnerOnly=true" },
              { label: "Free", href: "/events?freeOnly=true" },
              { label: "Youth programs", href: "/events?youthOnly=true" },
              { label: "Online", href: "/events?formats=online" },
            ].map((chip) => (
              <Link
                key={chip.href}
                href={chip.href}
                className="rounded-full border border-charcoal-500 px-4 py-1.5 text-charcoal-200 hover:border-white hover:bg-white/10 hover:text-white"
              >
                {chip.label}
              </Link>
            ))}
          </div>
          <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-6 border-t border-charcoal-600 pt-8">
            <div>
              <dt className="text-xs uppercase tracking-wide text-charcoal-300">This week</dt>
              <dd className="mt-1 font-display text-3xl font-bold text-white">
                {stats.eventsThisWeek}
                <span className="ml-1 text-sm font-normal text-charcoal-300">events</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-charcoal-300">Places</dt>
              <dd className="mt-1 font-display text-3xl font-bold text-white">
                {stats.venues}
                <span className="ml-1 text-sm font-normal text-charcoal-300">venues</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-charcoal-300">Scenes</dt>
              <dd className="mt-1 font-display text-3xl font-bold text-white">
                {stats.games}
                <span className="ml-1 text-sm font-normal text-charcoal-300">games</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="section" aria-labelledby="happening-heading">
        <div className="page-container">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="happening-heading" className="section-title">
                Happening near you
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-charcoal-600">
                The next events on the calendar — every card shows when, where, what it costs, and
                what it takes to join, with a timestamp for when we last verified the details.
              </p>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center text-sm font-medium text-redrock-500 hover:text-redrock-600"
            >
              View all events →
            </Link>
          </div>
          {events.length === 0 ? (
            <div className="mt-8 rounded-xl border-2 border-dashed border-charcoal-200 bg-white px-6 py-16 text-center">
              <p className="text-lg font-medium text-charcoal-900">No upcoming events listed yet.</p>
              <p className="mt-2 text-sm text-charcoal-600">
                Know about one?{" "}
                <Link href="/submit" className="font-medium text-redrock-500 hover:text-redrock-600">
                  Submit an event
                </Link>{" "}
                or check online options — listing an event takes about two minutes and a moderator
                reviews it before it goes live.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Link href="/events?formats=online" className="btn-outline">
                  Browse online events
                </Link>
                <Link href="/communities" className="btn-danger">
                  Find a community
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Games — Royal Tickets style dark section */}
      <section
        className="section section-dark"
        aria-labelledby="games-heading"
      >
        <div className="page-container">
          <h2 id="games-heading" className="section-title text-white">
            Find your community
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-charcoal-300">
            Utah gathers around these games — weeklies in Salt Lake, monthlies in Utah Valley,
            campus scenes up north. Pick yours to see the groups that run it and what&apos;s
            scheduled next.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {gameRows.map((game) => (
              <Link
                key={game.id}
                href={`/communities?game=${game.slug}`}
                className="rounded-xl border border-charcoal-600 bg-charcoal-800 px-5 py-2.5 text-sm font-medium text-white hover:border-redrock-500 hover:bg-redrock-500/10"
              >
                {game.name}
              </Link>
            ))}
            <Link
              href="/communities"
              className="rounded-xl border border-dashed border-charcoal-500 px-5 py-2.5 text-sm font-medium text-charcoal-300 hover:border-charcoal-300 hover:text-white"
            >
              More games →
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section section-light" aria-labelledby="how-heading">
        <div className="page-container">
          <h2 id="how-heading" className="section-title">
            How this site works
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-charcoal-600">
            Utah Esports is a directory, not a league. We don&apos;t run events — we make the ones
            happening across the state easy to find and hard to get wrong.
          </p>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <li
                key={item.step}
                className="rounded-xl border border-charcoal-200 bg-white p-6 lift"
              >
                <span className="font-display text-3xl font-bold text-redrock-500">{item.step}</span>
                <h3 className="mt-2 text-lg font-semibold text-charcoal-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-charcoal-600">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* New to the scene — Royal Tickets style CTA banner */}
      <section
        className="section"
        aria-labelledby="new-heading"
      >
        <div className="page-container">
          <div
            className="event-banner rounded-2xl overflow-hidden px-8 py-12 text-white sm:px-12"
            style={{
              backgroundImage: "url('/images/home/overlay.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <h2 id="new-heading" className="font-display text-3xl font-bold">
              New to the scene?
            </h2>
            <p className="mt-3 max-w-2xl text-charcoal-200">
              You don&apos;t need a team, a rank, or a decade of FGC tapes to start. Look for
              &quot;beginner-friendly&quot; badges, pick a casual session over a bracket, and arrive
              a little early — most Utah scenes are one friendly regular away from your first game.
              Youth players: bring a guardian for anything under 18, and check age rules on the
              event page first.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/events?beginnerOnly=true"
                className="btn-danger"
              >
                Find your first event
              </Link>
              <Link
                href="/communities"
                className="btn-outline"
              >
                Find a community
              </Link>
              <Link
                href="/schools"
                className="btn-outline"
              >
                Explore school programs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Organizers CTA */}
      <section className="section section-light" aria-labelledby="organizer-heading">
        <div className="page-container">
          <div className="flex flex-col gap-6 rounded-xl border border-charcoal-200 bg-white px-8 py-10 lift sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="organizer-heading" className="text-2xl font-bold text-charcoal-900">
                Run something local?
              </h2>
              <p className="mt-2 max-w-xl text-sm text-charcoal-600">
                Publish once — keep players updated everywhere. Claim your org, add events (weekly
                series included), announce to Discord from one place, and let freshness checks nudge
                you when a listing goes stale. Basic listings and corrections are free.{" "}
                {communityRows.length > 0
                  ? `${communityRows.length} communities are already listed.`
                  : null}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/submit" className="btn-danger">
                Add an event
              </Link>
              <Link href="/organizers" className="btn-outline">
                Claim your organization
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
