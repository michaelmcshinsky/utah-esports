import { eq } from "drizzle-orm";
import { buildIcsCalendar } from "@utah-esports/core";
import { eventOccurrences, venues } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { SITE_URL } from "@/src/lib/site";

export const dynamic = "force-dynamic";

/** Per-event "add to calendar" download. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  const slug = file.replace(/\.ics$/i, "");
  const database = db();
  const [row] = await database
    .select({ event: eventOccurrences, venueName: venues.name })
    .from(eventOccurrences)
    .leftJoin(venues, eq(eventOccurrences.venueId, venues.id))
    .where(eq(eventOccurrences.slug, slug))
    .limit(1);
  if (!row) {
    return new Response("Not found", { status: 404 });
  }
  const { event, venueName } = row;
  const ics = buildIcsCalendar({
    calendarName: `Utah Esports — ${event.title}`,
    url: `${SITE_URL}/events/${event.slug}`,
    events: [
      {
        uid: `${event.id}@utahesports.net`,
        title: event.title,
        description: event.description,
        url: `${SITE_URL}/events/${event.slug}`,
        location:
          event.format === "online"
            ? "Online"
            : [venueName, event.city, "UT"].filter(Boolean).join(", "),
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        status: event.status === "cancelled" ? ("CANCELLED" as const) : ("CONFIRMED" as const),
      },
    ],
  });
  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${slug}.ics"`,
      "cache-control": "public, max-age=300",
    },
  });
}
