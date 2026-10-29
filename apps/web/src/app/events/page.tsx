import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EventCard, type EventCardModel } from "@utah-esports/ui";
import { getEventGames, listUpcomingEvents } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { SearchHero } from "@/src/components/search-hero";
import { Accordion, type AccordionItem } from "@/src/components/accordion";

export const metadata: Metadata = {
  alternates: { canonical: "/events" },
  title: "Upcoming events",
  description:
    "Every upcoming Utah gaming event in one place - tournaments, weeklies, watch parties, and casual sessions. Filter by game, city, date, and more.",
};

export const dynamic = "force-dynamic";

function weekLabel(start: Date, end: Date): string {
  const opts = { month: "short", day: "numeric" } as const;
  if (start.getMonth() === end.getMonth() && start.getDate() === end.getDate()) {
    return start.toLocaleDateString("en-US", { ...opts, weekday: "long" });
  }
  return `${start.toLocaleDateString("en-US", { ...opts, weekday: "short" })} – ${end.toLocaleDateString("en-US", opts)}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

const EVENTS_FAQ: AccordionItem[] = [
  {
    question: "How often are new events added?",
    answer:
      "Events are added daily through automatic imports (start.gg sync every 6h, venue scans daily) and community submissions. Use the Explore page to filter by game, city, date, and more.",
  },
  {
    question: "How do I submit an event?",
    answer:
      "Use the Submit Event form at /submit. Paste a public event URL (start.gg, Eventbrite, Facebook, etc.) and the system auto-fills details. A moderator reviews it before it goes live.",
  },
  {
    question: "Are these events beginner-friendly?",
    answer:
      "Many are! Look for the 'Beginner-friendly' badge on event cards. Casual sessions and weekly meetups are great for new players — most Utah scenes are welcoming to newcomers.",
  },
  {
    question: "How do I get my community listed?",
    answer:
      "Submit your event or create an organization from the dashboard. Communities, Discord servers, Facebook groups, and venues can all be listed. We verify ownership before publishing.",
  },
  {
    question: "Can I embed a calendar on my website?",
    answer:
      "Yes! Each organization has a calendar feed (/api/calendar/org/[slug]) and an embeddable widget (/embed/calendar/[slug]). Subscribe to the global ICS feed to get all events in your calendar app.",
  },
];

async function getEvents(): Promise<EventCardModel[]> {
  const database = db();
  const events = await listUpcomingEvents(database, 60);
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
      sourceLabel: event.sourceId ? "Imported" : "Utah Esports",
      registrationUrl: event.registrationUrl,
    });
  }
  return cards;
}

export default async function EventsHubPage() {
  const events = await getEvents();

  // Group by calendar week.
  const weeks = new Map<string, { label: string; events: EventCardModel[] }>();
  for (const event of events) {
    const weekStart = startOfWeek(event.startsAt);
    const weekEnd = endOfWeek(event.startsAt);
    const key = weekStart.toISOString().slice(0, 10);
    if (!weeks.has(key)) {
      weeks.set(key, { label: weekLabel(weekStart, weekEnd), events: [] });
    }
    weeks.get(key)!.events.push(event);
  }

  const sortedWeeks = [...weeks.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="page-container py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-charcoal-900">
            Upcoming events
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-charcoal-600">
            Every listing on the site, ordered by date. Use{" "}
            <Link href="/explore" className="font-medium text-redrock-600 hover:underline">
              Explore
            </Link>{" "}
            to filter by game, city, skill level, price, and more - or search below.
          </p>
        </div>
        <Link
          href="/explore"
          className="inline-flex items-center rounded-lg border border-charcoal-300 px-4 py-2 text-sm font-medium text-charcoal-800 hover:bg-sandstone-50"
        >
          Open full filters
        </Link>
      </div>

      <Suspense fallback={<div className="mt-6 h-[124px] rounded-card bg-charcoal-100" />}>
        <SearchHero className="mt-6" />
      </Suspense>

      {events.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-charcoal-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-charcoal-800">No upcoming events listed yet.</p>
          <p className="mt-1 text-sm text-charcoal-600">
            Know about one?{" "}
            <Link href="/submit" className="font-medium text-redrock-600 hover:underline">
              Submit an event
            </Link>{" "}
            - it takes about two minutes and a moderator reviews it before it goes live.
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {sortedWeeks.map(([key, { label, events: weekEvents }]) => (
            <section key={key} aria-labelledby={`week-${key}`}>
              <div className="flex items-baseline gap-3 border-b border-charcoal-200 pb-2">
                <h2
                  id={`week-${key}`}
                  className="font-display text-lg font-semibold text-charcoal-900"
                >
                  {label}
                </h2>
                <span className="text-sm text-charcoal-500">
                  {weekEvents.length} event{weekEvents.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {weekEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {events.length >= 60 ? (
        <p className="mt-8 text-center text-sm text-charcoal-500">
          Showing the next 60 events.{" "}
          <Link href="/explore" className="font-medium text-redrock-600 hover:underline">
            Explore with filters
          </Link>{" "}
          to see the full catalog.
        </p>
      ) : null}

      {/* FAQ */}
      <section className="mt-16 border-t border-charcoal-200 pt-12" aria-labelledby="faq-heading">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 id="faq-heading" className="section-title">
            Frequently asked questions
          </h2>
        </div>
        <Accordion className="mt-8" items={EVENTS_FAQ} />
      </section>
    </div>
  );
}
