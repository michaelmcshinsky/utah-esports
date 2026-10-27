import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./lib.js";
import { Badge } from "./badge.js";
import { Card, CardContent, CardFooter } from "./card.js";
import { MediaImage } from "./media-image.js";

/**
 * The event card answers real questions before anyone clicks:
 * what, when, where, cost, age, registration state, and how fresh it is.
 * "Spots remaining" is intentionally never shown — we only display values
 * a trustworthy source actually supplied.
 */

export type EventCardModel = {
  id: string;
  slug: string;
  title: string;
  gameNames: string[];
  imageUrl?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  format: "in_person" | "online" | "hybrid";
  eventType?: string | null;
  city?: string | null;
  venueName?: string | null;
  priceCents?: number | null;
  priceNote?: string | null;
  venueFeeCents?: number | null;
  agePolicy?: string | null;
  beginnerFriendly?: boolean;
  youthProgram?: boolean;
  registrationState?: string | null;
  registrationDeadline?: Date | null;
  status?: string | null;
  statusNotice?: string | null;
  lastConfirmedAt?: Date | null;
  sourceLabel?: string | null;
  registrationUrl?: string | null;
  distanceKm?: number | null;
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  tournament: "Tournament",
  casual: "Casual session",
  watch_party: "Watch party",
  workshop: "Workshop",
  tryout: "Tryout",
  league: "League",
  other: "Event",
};

const AGE_LABELS: Record<string, string | null> = {
  all_ages: "All ages",
  teen: "Teens",
  "18_plus": "18+",
  "21_plus": "21+",
  unknown: null,
};

const REG_LABELS: Record<
  string,
  { label: string | null; tone: "success" | "warning" | "neutral" | "danger" }
> = {
  open: { label: "Registration open", tone: "success" },
  closing_soon: { label: "Closing soon", tone: "warning" },
  closed: { label: "Registration closed", tone: "neutral" },
  full: { label: "Full", tone: "neutral" },
  waitlist: { label: "Waitlist", tone: "warning" },
  unknown: { label: null, tone: "neutral" },
};

export function formatPrice(cents: number | null | undefined, note?: string | null): string | null {
  if (note) return note;
  if (cents == null) return null;
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function formatEventDate(startsAt: Date, endsAt?: Date | null, now = new Date()): string {
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const time = startsAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const dateOpts = { weekday: "short", month: "short", day: "numeric" } as const;
  const dayLabel = sameDay(startsAt, now)
    ? "Tonight"
    : sameDay(startsAt, new Date(now.getTime() + 86_400_000))
      ? "Tomorrow"
      : startsAt.toLocaleDateString("en-US", dateOpts);
  if (endsAt && !sameDay(startsAt, endsAt)) {
    const endDate = endsAt.toLocaleDateString("en-US", dateOpts);
    return `${dayLabel} ${time} – ${endDate}`;
  }
  return `${dayLabel} · ${time}`;
}

export function EventCard({
  event,
  className,
  footerAction,
  now,
}: {
  event: EventCardModel;
  className?: string;
  footerAction?: ReactNode;
  now?: Date;
}) {
  const price = formatPrice(event.priceCents, event.priceNote);
  const venueFee = formatPrice(event.venueFeeCents);
  const ageLabel = event.agePolicy ? AGE_LABELS[event.agePolicy] : null;
  const reg = event.registrationState ? REG_LABELS[event.registrationState] : null;
  const cancelled = event.status === "cancelled";
  const postponed = event.status === "postponed";

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden transition-shadow hover:shadow-card-hover",
        cancelled && "opacity-70",
        className,
      )}
    >
      <MediaImage
        src={event.imageUrl}
        alt={`${event.title} poster`}
        kind="event"
        ratio="video"
        label={event.gameNames[0] ?? event.title}
        overlayText={
          event.imageUrl
            ? undefined
            : (event.gameNames[0] ?? (event.eventType ? EVENT_TYPE_LABELS[event.eventType] : undefined))
        }
        className="rounded-t-card"
      />
      <CardContent className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {event.gameNames.slice(0, 3).map((g) => (
            <Badge key={g} variant="info">
              {g}
            </Badge>
          ))}
          {event.eventType ? (
            <Badge variant="neutral">{EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}</Badge>
          ) : null}
        </div>
        <h3 className="text-base font-semibold text-charcoal-900">
          <Link
            href={`/events/${event.slug}`}
            className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redrock-500 after:absolute after:inset-0"
          >
            {event.title}
          </Link>
        </h3>
        <p className="text-sm font-medium text-redrock-600">
          {formatEventDate(event.startsAt, event.endsAt, now)}
        </p>
        <p className="text-sm text-charcoal-600">
          {event.format === "online" ? (
            <span>Online</span>
          ) : (
            <>
              {[event.venueName, event.city].filter(Boolean).join(" · ") || "Location TBA"}
              {event.distanceKm != null ? (
                <span className="text-charcoal-400"> · {Math.round(event.distanceKm)} km away</span>
              ) : null}
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {price ? (
            <Badge variant={price === "Free" ? "success" : "neutral"}>{price}</Badge>
          ) : null}
          {venueFee ? <Badge variant="neutral">+{venueFee} venue</Badge> : null}
          {ageLabel ? <Badge variant="neutral">{ageLabel}</Badge> : null}
          {event.beginnerFriendly ? <Badge variant="accent">Beginner-friendly</Badge> : null}
          {event.youthProgram ? <Badge variant="accent">Youth</Badge> : null}
          {reg?.label ? (
            <Badge
              variant={
                reg.tone === "success" ? "success" : reg.tone === "warning" ? "warning" : "neutral"
              }
            >
              {reg.label}
            </Badge>
          ) : null}
        </div>
        {cancelled ? (
          <p role="status" className="rounded-lg bg-danger-100 px-3 py-2 text-sm font-medium text-danger-600">
            {event.statusNotice ?? "This event has been cancelled."}
          </p>
        ) : null}
        {postponed ? (
          <p role="status" className="rounded-lg bg-warning-100 px-3 py-2 text-sm font-medium text-warning-500">
            {event.statusNotice ?? "This event has been postponed — check details."}
          </p>
        ) : null}
        {event.registrationDeadline && event.registrationState === "open" ? (
          <p className="text-xs text-charcoal-600">
            Register by{" "}
            {event.registrationDeadline.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="relative z-10">
        {footerAction ?? (
          <Link
            href={`/events/${event.slug}`}
            className="text-sm font-medium text-redrock-600 hover:text-redrock-700"
          >
            View details →
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
