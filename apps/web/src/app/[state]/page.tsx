import Link from "next/link";
import { Suspense } from "react";
import { EventCard, type EventCardModel } from "@utah-esports/ui";
import {
  getUpcomingEvents,
  getPopularGames,
  getStats,
  getAllCommunities,
  type UpcomingEventRow,
} from "@/src/lib/static-data";
import { getStateConfig } from "@/src/lib/states/registry";
import { SearchHero } from "@/src/components/search-hero";
import { WebsiteJsonLd } from "@/src/components/seo/website-json-ld";
import { HeroBanner, SectionTitle, Accordion, type AccordionItem } from "@utah-esports/shared";

/** Home surfaces live event counts — render per request, not at build. */
export const dynamic = "force-dynamic";

function toEventCard(e: UpcomingEventRow): EventCardModel {
  return {
    id: e.id,
    slug: e.slug,
    title: e.title,
    gameNames: e.gameNames ?? [],
    imageUrl: e.imageUrl,
    startsAt: new Date(e.startsAt),
    endsAt: e.endsAt ? new Date(e.endsAt) : null,
    format: e.format as EventCardModel["format"],
    eventType: e.eventType,
    city: e.city,
    venueName: null,
    priceCents: e.priceCents,
    priceNote: e.priceNote,
    venueFeeCents: e.venueFeeCents,
    agePolicy: e.agePolicy,
    beginnerFriendly: e.beginnerFriendly ?? undefined,
    youthProgram: e.youthProgram ?? undefined,
    registrationState: e.registrationState,
    registrationDeadline: e.registrationDeadline ? new Date(e.registrationDeadline) : null,
    status: e.status,
    statusNotice: e.statusNotice,
    lastConfirmedAt: e.lastConfirmedAt ? new Date(e.lastConfirmedAt) : null,
    sourceLabel: "Utah Esports",
    registrationUrl: e.registrationUrl,
  };
}

const STATE_FAQ: AccordionItem[] = [
  {
    question: "How often are new events added?",
    answer: "Events are added daily through automatic imports and community submissions. Use Events to filter by game, city, date, and more.",
  },
  {
    question: "How do I submit an event?",
    answer: "Use the Submit Event form. Paste a public event URL and the system auto-fills details. A moderator reviews it before it goes live.",
  },
  {
    question: "Are these events beginner-friendly?",
    answer: "Many are! Look for the 'Beginner-friendly' badge. Casual sessions and weekly meetups are great for new players.",
  },
];

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

export default async function StateHomePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const config = getStateConfig(state);
  const [events, gameRows, communityRows, stats] = await Promise.all([
    getUpcomingEvents(6, config?.stateCode),
    getPopularGames(),
    getAllCommunities(config?.stateCode),
    getStats(config?.stateCode),
  ]);
  const cards = events.map(toEventCard);

  return (
    <>
      <WebsiteJsonLd />
      <HeroBanner
        title="Find your next game."
        subtitle="Tournaments, casual meetups, communities, teams, and places to play — kept current by the people who run them."
        backgroundImage={config?.heroImage}
      >
        <Suspense fallback={<div className="h-[124px] rounded-lg bg-charcoal-800/50" />}>
          <SearchHero className="mt-8" />
        </Suspense>
        <div className="mt-5 flex flex-wrap gap-2 text-sm">
          {[
            { label: "This weekend", href: `/${config?.slug}/events?preset=weekend` },
            { label: "Beginner-friendly", href: `/${config?.slug}/events?beginnerOnly=true` },
            { label: "Free", href: `/${config?.slug}/events?freeOnly=true` },
            { label: "Youth programs", href: `/${config?.slug}/events?youthOnly=true` },
            { label: "Online", href: `/${config?.slug}/events?formats=online` },
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
      </HeroBanner>

      {/* Upcoming Events */}
      <section className="section" aria-labelledby="happening-heading">
        <div className="page-container">
          <div className="flex items-end justify-between gap-4">
            <div>
              <SectionTitle id="happening-heading" className="mt-0">Happening near you</SectionTitle>
              <p className="mt-3 max-w-2xl text-sm text-charcoal-600">
                The next events on the calendar — every card shows when, where, what it costs, and
                what it takes to join.
              </p>
            </div>
            <Link
              href={`/${config?.slug}/events`}
              className="inline-flex items-center text-sm font-medium text-redrock-500 hover:text-redrock-600"
            >
              View all events →
            </Link>
          </div>
          {cards.length === 0 ? (
            <div className="mt-8 rounded-xl border-2 border-dashed border-charcoal-200 bg-white px-6 py-16 text-center">
              <p className="text-lg font-medium text-charcoal-900">No upcoming events listed yet.</p>
              <p className="mt-2 text-sm text-charcoal-600">
                Know about one?{" "}
                <Link href={`/${config?.slug}/submit`} className="text-redrock-500 hover:text-redrock-600">
                  Submit an event
                </Link>
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Games */}
      <section className="section section-dark" aria-labelledby="games-heading">
        <div className="page-container">
          <SectionTitle id="games-heading" className="mt-0 text-white">Find your community</SectionTitle>
          <p className="mt-3 max-w-2xl text-sm text-charcoal-300">
            {config?.name} gathers around these games. Pick yours to see the groups that run it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {gameRows.map((game: { id: string; slug: string; name: string }) => (
              <Link
                key={game.id}
                href={`/${config?.slug}/communities?game=${game.slug}`}
                className="rounded-xl border border-charcoal-600 bg-charcoal-800 px-5 py-2.5 text-sm font-medium text-white hover:border-redrock-500 hover:bg-redrock-500/10"
              >
                {game.name}
              </Link>
            ))}
            <Link
              href={`/${config?.slug}/communities`}
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
          <SectionTitle id="how-heading" className="mt-0">How this site works</SectionTitle>
          <p className="mt-3 max-w-2xl text-sm text-charcoal-600">
            {config?.name} Esports is a directory, not a league. We don&apos;t run events — we make
            the ones happening across {config?.name} easy to find and hard to get wrong.
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

      {/* New to the scene — CTA banner */}
      <section className="section" aria-labelledby="new-heading">
        <div className="page-container">
          <div
            className="event-banner rounded-2xl overflow-hidden px-8 py-12 text-white sm:px-12"
            style={{
              backgroundImage: "url('/images/home/overlay.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <SectionTitle id="new-heading" className="mt-0 text-white">New to the scene?</SectionTitle>
            <p className="mt-3 max-w-2xl text-charcoal-200">
              You don&apos;t need a team, a rank, or a decade of FGC tapes to start. Look for
              &quot;beginner-friendly&quot; badges, pick a casual session over a bracket, and arrive
              a little early — most {config?.name} scenes are one friendly regular away from your
              first game. Youth players: bring a guardian for anything under 18, and check age rules
              on the event page first.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/${config?.slug}/events?beginnerOnly=true`}
                className="btn-danger"
              >
                Find your first event
              </Link>
              <Link
                href={`/${config?.slug}/communities`}
                className="btn-outline"
              >
                Find a community
              </Link>
              <Link
                href={`/${config?.slug}/schools`}
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
              <SectionTitle id="organizer-heading" className="mt-0">Run something local?</SectionTitle>
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
              <Link href={`/${config?.slug}/submit`} className="btn-danger">
                Add an event
              </Link>
              <Link href={`/${config?.slug}/organizers`} className="btn-outline">
                Claim your organization
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section section-light" aria-labelledby="faq-heading">
        <div className="page-container">
          <SectionTitle id="faq-heading" className="mt-0">Frequently asked questions</SectionTitle>
          <Accordion className="mt-8" items={STATE_FAQ} />
        </div>
      </section>
    </>
  );
}
