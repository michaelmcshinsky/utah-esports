import { asc, eq, gte, inArray, lte } from "drizzle-orm";
import { buildIcsCalendar } from "@utah-esports/core";
import { eventOccurrences, venues } from "@utah-esports/db";
import { db } from "@/src/lib/db";

export const dynamic = "force-dynamic";

/** Global upcoming-events calendar subscription (next 60 days). */
export async function GET() {
  const now = new Date();
  const horizon = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const database = db();
  const rows = await database
    .select({ event: eventOccurrences, venueName: venues.name })
    .from(eventOccurrences)
    .leftJoin(venues, eq(eventOccurrences.venueId, venues.id))
    .where(
      inArray(eventOccurrences.status, ["published", "needs_verification"] as const),
    )
    .orderBy(asc(eventOccurrences.startsAt))
    .limit(500);

  const upcoming = rows.filter(
    (r) => r.event.startsAt >= now && r.event.startsAt <= horizon,
  );

  const ics = buildIcsCalendar({
    calendarName: "Utah Esports — Upcoming",
    url: "https://utahesports.net/calendar/global.ics",
    events: upcoming.map(({ event, venueName }) => ({
      uid: `${event.id}@utahesports.net`,
      title: event.title,
      description: event.description,
      url: `https://utahesports.net/events/${event.slug}`,
      location:
        event.format === "online"
          ? "Online"
          : [venueName, event.city, "UT"].filter(Boolean).join(", "),
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      status: event.status === "cancelled" ? ("CANCELLED" as const) : ("CONFIRMED" as const),
    })),
  });

  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'attachment; filename="utah-esports.ics"',
      "cache-control": "public, max-age=300",
    },
  });
}

// Keep gte/lte imports referenced for future window filtering helpers.
void gte;
void lte;
