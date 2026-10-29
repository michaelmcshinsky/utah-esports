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
  MediaImage,
  Avatar,
  formatPrice,
  formatEventDate,
} from "@utah-esports/ui";
import {
  getEventBySlug,
  getEventGames,
  getEventLinks,
  listCommunities,
  organizations,
  venues,
} from "@utah-esports/db";
import { eq } from "drizzle-orm";
import { db } from "@/src/lib/db";
import { absoluteUrl } from "@/src/lib/site";
import { ReportButton } from "@/src/components/report-button";
import { SaveEventButton } from "@/src/components/save-event-button";
import { FollowButton } from "@/src/components/follow-button";
import { EventJsonLd } from "@/src/components/seo/event-json-ld";

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
  const description =
    event.description?.slice(0, 160) ??
    `${event.title} — ${event.startsAt.toLocaleDateString("en-US", { month: "long", day: "numeric" })}${event.city ? ` in ${event.city}` : ""}. Utah gaming event with registration details, age rules, and last-checked info.`;
  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      title: event.title,
      description,
      type: "website",
      images: event.imageUrl ? [event.imageUrl] : ["/og-image.jpg"],
    },
    twitter: {
      card: event.imageUrl ? "summary_large_image" : "summary",
      images: event.imageUrl ? [event.imageUrl] : ["/og-image.jpg"],
    },
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

  const [gameRows, linkRows, venue, org] = await Promise.all([
    getEventGames(database, event.id),
    getEventLinks(database, event.id),
    event.venueId
      ? database
          .select()
          .from(venues)
          .where(eq(venues.id, event.venueId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
    event.organizationId
      ? database
          .select({ name: organizations.name, slug: organizations.slug })
          .from(organizations)
          .where(eq(organizations.id, event.organizationId))
          .limit(1)
          .then((rows) => rows[0] ?? null)
      : Promise.resolve(null),
  ]);

  const firstGameSlug = gameRows[0]?.game.slug ?? null;
  const relatedCommunity = await (async () => {
    if (!firstGameSlug && !event.city) return null;
    const withCity = await listCommunities(database, {
      gameSlug: firstGameSlug ?? undefined,
      city: event.city ?? undefined,
    });
    if (withCity.length > 0) return withCity[0];
    if (firstGameSlug) {
      // Fall back to same-game anywhere in Utah rather than nothing.
      const byGame = await listCommunities(database, { gameSlug: firstGameSlug });
      if (byGame.length > 0) return byGame[0];
    }
    return null;
  })();

  const registrationUrl =
    event.registrationUrl ?? linkRows.find((l) => l.kind === "registration")?.url ?? null;
  const rulesUrl = linkRows.find((l) => l.kind === "rules")?.url ?? null;
  const price = formatPrice(event.priceCents, event.priceNote);
  const venueFee = formatPrice(event.venueFeeCents);
  const cancelled = event.status === "cancelled";
  const postponed = event.status === "postponed";

  return (
    <>
      {/* Banner Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage: event.imageUrl
            ? `linear-gradient(rgba(36,38,43,0.65), rgba(36,38,43,0.85)), url('${event.imageUrl}')`
            : `linear-gradient(rgba(36,38,43,0.7), rgba(36,38,43,0.9)), url('/images/home/utah-esports-banner-2.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="page-container py-14">
          <nav aria-label="Breadcrumb" className="text-sm text-charcoal-300">
            <Link href="/explore" className="hover:text-white">
              Explore
            </Link>{" "}
            / <span className="text-charcoal-100">{event.title}</span>
          </nav>
          <div className="mt-4 flex flex-wrap gap-1.5">
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
          <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {event.title}
          </h1>
          <p className="mt-3 text-lg font-medium text-sandstone-300">
            {formatEventDate(event.startsAt, event.endsAt)}
            {event.city ? ` · ${event.city}, UT` : ""}
          </p>
          {registrationUrl ? (
            <a
              href={`/api/out/event/${event.id}`}
              className="mt-5 inline-flex rounded-lg bg-redrock-500 px-6 py-3 text-sm font-semibold text-white hover:bg-redrock-600"
              rel="noopener noreferrer"
            >
              Register on the original site →
            </a>
          ) : null}
        </div>
      </div>

      <div className="page-container py-8">
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <article>
          <MediaImage
            src={event.imageUrl}
            alt={`${event.title} poster`}
            kind="event"
            ratio="wide"
            className="mt-5 rounded-card"
            label={gameRows[0]?.game.name ?? event.title}
            overlayText={
              event.imageUrl
                ? undefined
                : (gameRows[0]?.game.name ??
                  (event.city ? `${event.city}, Utah` : "Utah gaming event"))
            }
          />

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
            {venue ? (
              <div className="mt-3 rounded-lg border border-charcoal-200 bg-white p-3 text-sm">
                <p className="font-medium text-charcoal-900">
                  <Link href={`/places/${venue.slug}`} className="hover:text-redrock-600">
                    {venue.name}
                  </Link>
                </p>
                {[venue.address, venue.city, venue.state].filter(Boolean).join(", ") ? (
                  <p className="mt-0.5 text-charcoal-600">
                    {[venue.address, venue.city, venue.state].filter(Boolean).join(", ")}
                  </p>
                ) : null}
                {venue.byodRequired ? (
                  <p className="mt-1 text-xs text-warning-500">Bring your own device</p>
                ) : null}
              </div>
            ) : null}
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
                The organizer hasn&apos;t listed specifics. As a rule of thumb for Utah gaming
                events: bring your controller (and a spare if you have one), a phone charger,
                cash or card for venue fees, and arrive 15–20 minutes early for check-in. If the
                event is BYOD, the venue page will say so — otherwise assume gear is provided.
                Still unsure? Message the contact below before you drive over.
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
            <div className="mt-3 flex items-start gap-3">
              {event.contactName ? (
                <Avatar name={event.contactName} size="md" decorative />
              ) : null}
              <p className="text-charcoal-700">
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
                  "Organizer contact not listed — use the Report link if details look wrong, or reach out through the linked registration page."
                )}
              </p>
            </div>
            {relatedCommunity ? (
              <p className="mt-4 text-sm text-charcoal-700">
                Related community:{" "}
                <Link
                  href={`/communities/${relatedCommunity.slug}`}
                  className="font-medium text-redrock-600 hover:underline"
                >
                  {relatedCommunity.name}
                </Link>
              </p>
            ) : null}
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
              <FollowButton kind="event" targetId={event.id} />
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
      <EventJsonLd
        title={event.title}
        description={event.description}
        startsAt={event.startsAt}
        endsAt={event.endsAt}
        format={event.format}
        slug={event.slug}
        imageUrl={event.imageUrl}
        city={event.city}
        venueName={venue?.name ?? null}
        venueAddress={venue?.address ?? null}
        priceCents={event.priceCents}
        registrationUrl={event.registrationUrl}
        organizerName={org?.name ?? event.contactName}
        status={event.status}
        registrationState={event.registrationState}
      />
    </>
  );
}
