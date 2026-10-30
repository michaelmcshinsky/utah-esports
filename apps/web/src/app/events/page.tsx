import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState, EventCard, type EventCardModel } from "@utah-esports/ui";
import {
  applyPreset,
  parseFilters,
  serializeFilters,
  type EventSearchFilter,
} from "@utah-esports/core";
import { listGames, searchEvents, getEventGames } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { FilterPanel } from "@/src/components/filter-panel";
import { EventMapView } from "@/src/components/map-view";
import { EventCalendarView } from "@/src/components/calendar-view";
import { ExplorePagination } from "@/src/components/explore-pagination";

export const metadata: Metadata = {
  alternates: { canonical: "/events" },
  title: "Events",
  description:
    "Find Utah gaming events by game, date, city, skill level, and more — tournaments, casual sessions, watch parties, and tryouts.",
};

export const revalidate = 0;

type SearchParams = Record<string, string | string[] | undefined>;

function withPreset(params: SearchParams): EventSearchFilter {
  const filter = parseFilters(params as Record<string, string>);
  const preset = typeof params.preset === "string" ? params.preset : null;
  return preset ? applyPreset(preset, filter) : filter;
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filter = withPreset(params);
  const view = typeof params.view === "string" ? params.view : "list";
  const database = db();

  const [result, gameOptions] = await Promise.all([
    searchEvents(database, filter),
    listGames(database),
  ]);

  const cards: EventCardModel[] = await Promise.all(
    result.items.map(async (event) => {
      const rows = await getEventGames(database, event.id);
      return {
        id: event.id,
        slug: event.slug,
        title: event.title,
        gameNames: rows.map((r) => r.game.name),
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
        sourceLabel: event.sourceId ? "Imported" : "Utah Esports",
        registrationUrl: event.registrationUrl,
      } satisfies EventCardModel;
    }),
  );

  const viewHref = (nextView: string) => {
    const base: EventSearchFilter = { ...filter, page: 1 };
    return `/events?${serializeFilters(base)}${nextView !== "list" ? `&view=${nextView}` : ""}`;
  };

  const mapPoints = result.items
    .filter((e) => e.lat != null && e.lng != null)
    .map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      lat: e.lat as number,
      lng: e.lng as number,
      startsAt: e.startsAt.toISOString(),
      city: e.city,
    }));

  return (
    <>
      {/* Hero band — light, ballroom-hub style */}
      <div className="hero-band text-white">
        <div className="page-container py-10 sm:py-12">
          <h1 className="text-2xl font-bold sm:text-3xl">Events</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/85">
            {result.total > 0
              ? `${result.total} event${result.total === 1 ? "" : "s"} matching your filters.`
              : "Find Utah gaming events by game, date, city, and more."}{" "}
            Switch between list, calendar, and map views.{" "}
            <Link href="/submit" className="underline hover:text-white">
              Submit an event
            </Link>{" "}
            or{" "}
            <Link href="/communities" className="underline hover:text-white">
              find a community
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Search + results */}
      <section className="section" aria-labelledby="events-heading">
        <div className="page-container">
          <h2 id="events-heading" className="sr-only">Search results</h2>

          {/* Filter panel */}
          <Suspense fallback={<div className="h-20 rounded-lg bg-white" />}>
            <FilterPanel
              filter={filter}
              gameOptions={gameOptions.map((g) => ({ slug: g.slug, name: g.name }))}
            />
          </Suspense>

          {/* View toggle + result count */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-charcoal-600" aria-live="polite">
              {result.total === 0
                ? "No matching events"
                : `${result.total} event${result.total === 1 ? "" : "s"}`}
            </p>
            <nav aria-label="View" className="flex rounded-lg border border-charcoal-300 bg-white p-0.5">
              {(["list", "calendar", "map"] as const).map((v) => (
                <Link
                  key={v}
                  href={viewHref(v)}
                  aria-current={view === v ? "page" : undefined}
                  className={
                    view === v
                      ? "rounded-md bg-redrock-500 px-3 py-1.5 text-sm font-medium text-white"
                      : "rounded-md px-3 py-1.5 text-sm font-medium text-charcoal-600 hover:text-charcoal-900"
                  }
                >
                  {v === "list" ? "List" : v === "calendar" ? "Calendar" : "Map"}
                </Link>
              ))}
            </nav>
          </div>

          {/* Results */}
          <div className="mt-6">
            {cards.length === 0 ? (
              <EmptyState
                title="Nothing matches those filters yet"
                description="Try a wider date range, remove the city filter, or check online events and communities instead."
                actions={
                  <>
                    <Link href="/events" className="btn-danger">
                      Reset filters
                    </Link>
                    <Link href="/events?formats=online" className="btn-outline">
                      Online events
                    </Link>
                    <Link href="/communities" className="btn-outline">
                      Communities
                    </Link>
                  </>
                }
              />
            ) : view === "map" ? (
              <EventMapView points={mapPoints} />
            ) : view === "calendar" ? (
              <EventCalendarView
                events={cards.map((c) => ({
                  slug: c.slug,
                  title: c.title,
                  startsAt: c.startsAt.toISOString(),
                  gameNames: c.gameNames,
                }))}
              />
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {cards.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
                <ExplorePagination filter={filter} total={result.total} view={view} />
              </>
            )}
          </div>

          {cards.length > 0 && view === "list" ? (
            <p className="mt-4 text-xs text-charcoal-500">
              Tip: dates and filters live in the URL — bookmark or share this page.
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}
