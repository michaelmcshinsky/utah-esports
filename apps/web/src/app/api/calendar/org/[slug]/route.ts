import { asc, eq } from "drizzle-orm";
import { buildIcsCalendar } from "@utah-esports/core";
import { eventOccurrences, getOrganizationBySlug, venues } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { SITE_URL } from "@/src/lib/site";

export const dynamic = "force-dynamic";

const UPCOMING_STATUSES = ["published", "postponed", "needs_verification"] as const;

/** Per-organization calendar feed for embedding/subscriptions. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const orgSlug = slug.replace(/\.ics$/i, "");
  const database = db();
  const org = await getOrganizationBySlug(database, orgSlug);
  if (!org) return new Response("Not found", { status: 404 });
  const now = new Date();
  const horizon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const rows = await database
    .select({ event: eventOccurrences, venueName: venues.name })
    .from(eventOccurrences)
    .leftJoin(venues, eq(eventOccurrences.venueId, venues.id))
    .where(eq(eventOccurrences.organizationId, org.id))
    .orderBy(asc(eventOccurrences.startsAt))
    .limit(500);

  const upcoming = rows.filter(
    (r) =>
      r.event.startsAt >= now &&
      r.event.startsAt <= horizon &&
      (UPCOMING_STATUSES as readonly string[]).includes(r.event.status),
  );

  const ics = buildIcsCalendar({
    calendarName: `Utah Esports — ${org.name}`,
    url: `${SITE_URL}/dashboard/org/${org.slug}`,
    events: upcoming.map(({ event, venueName }) => ({
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
    })),
  });

  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${org.slug}.ics"`,
      "cache-control": "public, max-age=300",
    },
  });
}
