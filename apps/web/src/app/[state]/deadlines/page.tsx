import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@utah-esports/ui";
import { HeroBanner, SectionTitle } from "@utah-esports/shared";
import { eventOccurrences, getEventGames } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { and, eq, gte, inArray, isNotNull, asc } from "drizzle-orm";
import { getStateConfig } from "@/src/lib/states/registry";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const config = getStateConfig(state);
  if (!config) return { title: "Not found" };
  return {
    title: "Registration deadlines",
    description: `Track registration deadlines for ${config.name} gaming events — tournaments, leagues, and competitions with upcoming cutoffs.`,
    alternates: { canonical: `/${config.slug}/deadlines` },
  };
}

export default async function StateDeadlinesPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const config = getStateConfig(state);
  const database = db();
  const now = new Date();
  const events = await database
    .select()
    .from(eventOccurrences)
    .where(
      and(
        inArray(eventOccurrences.status, ["published", "needs_verification", "postponed"]),
        isNotNull(eventOccurrences.registrationDeadline),
        gte(eventOccurrences.registrationDeadline, now),
        ...(config?.stateCode ? [eq(eventOccurrences.state, config.stateCode)] : []),
      ),
    )
    .orderBy(asc(eventOccurrences.registrationDeadline))
    .limit(50);

  // Get game names for each event
  const withGames = await Promise.all(
    events.map(async (event) => ({
      event,
      games: await getEventGames(database, event.id),
    })),
  );

  return (
    <>
      {/* Hero band */}
      <HeroBanner variant="band" title="Registration deadlines">
        <p className="mt-3 max-w-2xl text-charcoal-200">
          {withGames.length} upcoming deadline{withGames.length === 1 ? "" : "s"} for {config?.name}{" "}
          gaming events, sorted by urgency.{" "}
          <Link href={`/${config?.slug}/events`} className="underline hover:text-white">
            Browse all events
          </Link>
          .
        </p>
      </HeroBanner>

      {/* Deadlines list */}
      <section className="section" aria-labelledby="deadlines-heading">
        <div className="page-container">
          <SectionTitle id="deadlines-heading">Upcoming deadlines</SectionTitle>
          {withGames.length === 0 ? (
            <div className="mt-8 rounded-xl border-2 border-dashed border-charcoal-200 bg-white px-6 py-16 text-center">
              <p className="text-lg font-medium text-charcoal-900">
                No upcoming registration deadlines.
              </p>
              <p className="mt-2 text-sm text-charcoal-600">
                Deadlines appear here as soon as events list them.{" "}
                <Link
                  href={`/${config?.slug}/events`}
                  className="text-redrock-500 hover:text-redrock-600"
                >
                  Explore all events
                </Link>{" "}
                or{" "}
                <Link
                  href={`/${config?.slug}/submit`}
                  className="text-redrock-500 hover:text-redrock-600"
                >
                  submit one
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-4">
              {withGames.map(({ event, games }) => {
                const deadline = event.registrationDeadline!;
                const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const urgency =
                  daysUntil <= 3 ? "high" : daysUntil <= 7 ? "medium" : "low";
                return (
                  <div
                    key={event.id}
                    className={`flex flex-col gap-3 rounded-xl border bg-white p-5 lift sm:flex-row sm:items-center sm:justify-between ${
                      urgency === "high"
                        ? "border-redrock-500"
                        : urgency === "medium"
                          ? "border-gold-400"
                          : "border-charcoal-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <div>
                          <h3 className="font-semibold text-charcoal-900">
                            <Link
                              href={`/events/${event.slug}`}
                              className="hover:text-redrock-500"
                            >
                              {event.title}
                            </Link>
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {games.slice(0, 3).map((g) => (
                              <Badge key={g.game.id} variant="info">
                                {g.game.name}
                              </Badge>
                            ))}
                          </div>
                          {event.city ? (
                            <p className="mt-1 text-sm text-charcoal-500">{event.city}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            urgency === "high"
                              ? "danger"
                              : urgency === "medium"
                                ? "warning"
                                : "success"
                          }
                        >
                          {daysUntil === 0
                            ? "Today"
                            : daysUntil === 1
                              ? "Tomorrow"
                              : `${daysUntil} days left`}
                        </Badge>
                        <span className="text-sm text-charcoal-600">
                          {deadline.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {event.registrationUrl ? (
                        <a
                          href={`/api/out/event/${event.id}`}
                          className="btn-danger btn-sm"
                          rel="noopener noreferrer"
                        >
                          Register →
                        </a>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="mt-8 text-sm text-charcoal-500">
            Deadlines are tracked automatically from event listings. If one is missing, the
            organizer hasn&apos;t listed it — reach out through the event page.
          </p>
        </div>
      </section>
    </>
  );
}
