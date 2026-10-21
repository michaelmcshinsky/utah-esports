import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Alert,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FreshnessBadge,
  formatPrice,
  formatEventDate,
} from "@utah-esports/ui";
import { getEventBySlug, getEventGames, getEventLinks } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { absoluteUrl } from "@/src/lib/site";
import { ReportButton } from "@/src/components/report-button";
import { SaveEventButton } from "@/src/components/save-event-button";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  tournament: "Tournament",
  casual: "Casual session",
  watch_party: "Watch party",
  workshop: "Workshop",
  tryout: "Tryout",
  league: "League",
  other: "Event",
};

const AGE_LABELS: Record<string, string> = {
  all_ages: "All ages welcome",
  teen: "Teens welcome (check details)",
  "18_plus": "18 and over",
  "21_plus": "21 and over",
  unknown: "Age requirements not listed",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(db(), slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.description?.slice(0, 160) ?? `Gaming event in ${event.city ?? "Utah"}`,
    openGraph: { type: "website" },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const database = db();
  const event = await getEventBySlug(database, slug);
  if (!event || event.status === "draft" || event.status === "archived") notFound();

  const [gameRows, linkRows] = await Promise.all([
    getEventGames(database, event.id),
    getEventLinks(database, event.id),
  ]);

  const registrationUrl =
    event.registrationUrl ?? linkRows.find((l) => l.kind === "registration")?.url ?? null;
  const rulesUrl = linkRows.find((l) => l.kind === "rules")?.url ?? null;
  const price = formatPrice(event.priceCents, event.priceNote);
  const venueFee = formatPrice(event.venueFeeCents);
  const cancelled = event.status === "cancelled";
  const postponed = event.status === "postponed";

  return (
    <div className="page-container py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-charcoal-600">
        <Link href="/explore" className="hover:text-redrock-600">
          Explore
        </Link>{" "}
        / <span>{event.title}</span>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <article>
          <div className="flex flex-wrap gap-1.5">
            {gameRows.map((g) => (
              <Link key={g.game.id} href={`/explore?games=${g.game.slug}`}>
                <Badge variant="info">{g.game.name}</Badge>
              </Link>
            ))}
            <Badge variant="neutral">{TYPE_LABELS[event.eventType] ?? event.eventType}</Badge>
            <Badge variant="neutral">
              {event.format === "online" ? "Online" : event.format === "hybrid" ? "Hybrid" : "In person"}
            </Badge>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold text-charcoal-900">{event.title}</h1>
          <p className="mt-2 text-lg font-medium text-redrock-600">
            {formatEventDate(event.startsAt, event.endsAt)}
          </p>

          {cancelled ? (
            <Alert variant="danger" title="Cancelled" className="mt-4">
              {event.statusNotice ?? "This event has been cancelled by the organizer."}
            </Alert>
          ) : null}
          {postponed ? (
            <Alert variant="warning" title="Postponed" className="mt-4">
              {event.statusNotice ?? "This event has been postponed — check back for a new date."}
            </Alert>
          ) : null}
          {event.status === "needs_verification" ? (
            <Alert variant="warning" title="Needs verification" className="mt-4">
              This listing hasn&apos;t been confirmed recently. Details may have changed — verify
              with the organizer before attending.
            </Alert>
          ) : null}

          <section aria-labelledby="about" className="mt-8">
            <h2 id="about" className="text-lg font-semibold">
              What is it?
            </h2>
            {event.description ? (
              <p className="mt-2 whitespace-pre-wrap text-charcoal-700">{event.description}</p>
            ) : (
              <p className="mt-2 text-sm text-charcoal-600">No description provided yet.</p>
            )}
          </section>

          <section aria-labelledby="participate" className="mt-8">
            <h2 id="participate" className="text-lg font-semibold">
              Can I participate?
            </h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-charcoal-200 bg-white p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-charcoal-500">Age</dt>
                <dd className="mt-1 text-sm">{AGE_LABELS[event.agePolicy] ?? event.agePolicy}</dd>
              </div>
              <div className="rounded-lg border border-charcoal-200 bg-white p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-charcoal-500">Skill</dt>
                <dd className="mt-1 text-sm">
                  {event.skillLevel === "beginner_friendly" || event.beginnerFriendly
                    ? "Beginner-friendly"
                    : event.skillLevel === "unknown"
                      ? "Skill level not specified"
                      : event.skillLevel.replace(/_/g, " ")}
                </dd>
              </div>
              <div className="rounded-lg border border-charcoal-200 bg-white p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-charcoal-500">Entry</dt>
                <dd className="mt-1 text-sm capitalize">
                  {event.entryMode === "either"
                    ? "Individual or team"
                    : `${event.entryMode} entry`}
                </dd>
              </div>
              <div className="rounded-lg border border-charcoal-200 bg-white p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-charcoal-500">
                  Registration
                </dt>
                <dd className="mt-1 text-sm capitalize">
                  {event.registrationState === "unknown"
                    ? "Not specified"
                    : event.registrationState.replace(/_/g, " ")}
                  {event.registrationDeadline
                    ? ` · closes ${event.registrationDeadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : ""}
                </dd>
              </div>
            </dl>
            {event.platforms?.length ? (
              <p className="mt-3 text-sm text-charcoal-600">
                Platforms: {event.platforms.join(", ")}
              </p>
            ) : null}
          </section>

          <section aria-labelledby="whenwhere" className="mt-8">
            <h2 id="whenwhere" className="text-lg font-semibold">
              When and where do I go?
            </h2>
            <p className="mt-2 text-charcoal-700">
              {event.startsAt.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}{" "}
              at{" "}
              {event.startsAt.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
              {event.endsAt
                ? ` – ${event.endsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
                : ""}
            </p>
            {event.format === "online" ? (
              <p className="mt-1 text-charcoal-700">Online event</p>
            ) : (
              <p className="mt-1 text-charcoal-700">
                {[event.city, "UT"].filter(Boolean).join(", ")}
              </p>
            )}
            {event.scheduleNotes ? (
              <p className="mt-2 text-sm text-charcoal-600">{event.scheduleNotes}</p>
            ) : null}
          </section>

          <section aria-labelledby="cost" className="mt-8">
            <h2 id="cost" className="text-lg font-semibold">
              What does it cost?
            </h2>
            <p className="mt-2 text-charcoal-700">
              {price ?? "Entry cost not listed — confirm with the organizer."}
              {venueFee ? ` + ${venueFee} venue fee` : ""}
            </p>
          </section>

          {event.bringNotes || event.parkingNotes || event.firstTimeNotes ? (
            <section aria-labelledby="prepare" className="mt-8">
              <h2 id="prepare" className="text-lg font-semibold">
                What should I bring?
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-charcoal-700">
                {event.bringNotes ? <li>{event.bringNotes}</li> : null}
                {event.parkingNotes ? <li>{event.parkingNotes}</li> : null}
                {event.firstTimeNotes ? <li>{event.firstTimeNotes}</li> : null}
              </ul>
            </section>
          ) : (
            <section aria-labelledby="prepare" className="mt-8">
              <h2 id="prepare" className="text-lg font-semibold">
                What should I bring?
              </h2>
              <p className="mt-2 text-sm text-charcoal-600">
                Not specified. Bring your controller/console/PC as appropriate and check with the
                organizer if unsure.
              </p>
            </section>
          )}

          <section aria-labelledby="register" className="mt-8">
            <h2 id="register" className="text-lg font-semibold">
              How do I register?
            </h2>
            {registrationUrl ? (
              <a
                href={`/api/out/event/${event.id}`}
                className="mt-3 inline-flex rounded-lg bg-redrock-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-redrock-600"
                rel="noopener noreferrer"
              >
                Register on the original site →
              </a>
            ) : (
              <p className="mt-2 text-sm text-charcoal-600">
                No registration link listed. Contact the organizer below.
              </p>
            )}
            {rulesUrl ? (
              <p className="mt-2 text-sm">
                <a href={rulesUrl} className="text-redrock-600 hover:underline" rel="noopener noreferrer">
                  Rules
                </a>
              </p>
            ) : null}
            <p className="mt-2 text-xs text-charcoal-500">
              Registration stays on the organizer&apos;s platform — we link out, we don&apos;t process
              payments.
            </p>
          </section>

          <section aria-labelledby="contact" className="mt-8">
            <h2 id="contact" className="text-lg font-semibold">
              Who can answer questions?
            </h2>
            <p className="mt-2 text-charcoal-700">
              {event.contactName ? (
                <>
                  {event.contactName}
                  {event.contactEmail ? (
                    <>
                      {" · "}
                      <a href={`mailto:${event.contactEmail}`} className="text-redrock-600 hover:underline">
                        {event.contactEmail}
                      </a>
                    </>
                  ) : null}
                </>
              ) : event.contactEmail ? (
                <a href={`mailto:${event.contactEmail}`} className="text-redrock-600 hover:underline">
                  {event.contactEmail}
                </a>
              ) : (
                "Organizer contact not listed."
              )}
            </p>
          </section>
        </article>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <a
                href={`/api/calendar/event/${event.slug}.ics`}
                className="rounded-lg border border-charcoal-300 px-4 py-2 text-center text-sm font-medium hover:bg-sandstone-50"
                download
              >
                Add to calendar
              </a>
              <SaveEventButton eventId={event.id} />
              <ReportButton targetType="event" targetId={event.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listing trust</CardTitle>
            </CardHeader>
            <CardContent>
              <FreshnessBadge lastConfirmedAt={event.lastConfirmedAt} sourceLabel={null} />
              <p className="mt-2 text-xs text-charcoal-500">
                Last observed{" "}
                {event.lastObservedAt
                  ? event.lastObservedAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
                . See something wrong? Use Report.
              </p>
              <p className="mt-3 text-xs text-charcoal-500">
                Canonical URL:{" "}
                <a className="underline" href={absoluteUrl(`/events/${event.slug}`)}>
                  utahesports.net/events/{event.slug}
                </a>
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
