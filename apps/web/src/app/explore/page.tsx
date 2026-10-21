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
import { FilterBar } from "@/src/components/filter-bar";
import { EventMapView } from "@/src/components/map-view";
import { EventCalendarView } from "@/src/components/calendar-view";
import { ExplorePagination } from "@/src/components/explore-pagination";

export const metadata: Metadata = {
  title: "Explore events",
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

export default async function ExplorePage({
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
    return `/explore?${serializeFilters(base)}${nextView !== "list" ? `&view=${nextView}` : ""}`;
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
    <div className="page-container py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-charcoal-900 sm:text-3xl">
            Explore events
          </h1>
          <p className="mt-1 text-sm text-charcoal-600">
            One search across every listing — switch between list, calendar, and map without
            losing filters.
          </p>
        </div>
        <nav
          aria-label="View"
          className="flex rounded-lg border border-charcoal-300 bg-white p-0.5"
        >
          {(["list", "calendar", "map"] as const).map((v) => (
            <Link
              key={v}
              href={viewHref(v)}
              aria-current={view === v ? "page" : undefined}
              className={
                view === v
                  ? "rounded-md bg-charcoal-900 px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-md px-3 py-1.5 text-sm font-medium text-charcoal-600 hover:text-charcoal-900"
              }
            >
              {v === "list" ? "List" : v === "calendar" ? "Calendar" : "Map"}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[20rem_1fr]">
        <div>
          <Suspense fallback={<div className="h-40 rounded-card bg-white" />}>
            <FilterBar
              gameOptions={gameOptions.map((g) => ({ slug: g.slug, name: g.name }))}
            />
          </Suspense>
        </div>

        <div aria-live="polite">
          <p className="mb-3 text-sm text-charcoal-600">
            {result.total === 0
              ? "No matching events"
              : `${result.total} event${result.total === 1 ? "" : "s"}`}
          </p>

          {cards.length === 0 ? (
            <EmptyState
              title="Nothing matches those filters yet"
              description="Utah's listing coverage is growing — try a wider date range, remove the city filter, or check online events and communities instead."
              actions={
                <>
                  <Link
                    href="/explore"
                    className="rounded-lg bg-charcoal-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    Reset filters
                  </Link>
                  <Link
                    href="/explore?formats=online"
                    className="rounded-lg border border-charcoal-300 px-4 py-2 text-sm font-medium"
                  >
                    Online events
                  </Link>
                  <Link
                    href="/communities"
                    className="rounded-lg border border-charcoal-300 px-4 py-2 text-sm font-medium"
                  >
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
              <div className="grid gap-4 sm:grid-cols-2">
                {cards.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
              <ExplorePagination filter={filter} total={result.total} view={view} />
            </>
          )}

          {cards.length > 0 && view === "list" ? (
            <p className="mt-4 text-xs text-charcoal-500">
              Tip: dates and filters live in the URL — bookmark or share this page.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
