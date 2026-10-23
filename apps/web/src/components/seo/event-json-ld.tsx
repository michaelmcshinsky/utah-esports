import { JsonLd } from "@/src/components/json-ld";
import { SITE_URL } from "@/src/lib/site";

type EventJsonLdProps = {
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  format: "in_person" | "online" | "hybrid";
  slug: string;
  imageUrl?: string | null;
  city?: string | null;
  venueName?: string | null;
  venueAddress?: string | null;
  priceCents?: number | null;
  registrationUrl?: string | null;
  organizerName?: string | null;
  status?: string | null;
  registrationState?: string | null;
};

/**
 * schema.org Event — only asserted from data we actually store:
 * no invented offers, addresses, or end times. Cancelled events keep
 * eventStatus so rich results reflect reality.
 */
export function EventJsonLd(props: EventJsonLdProps) {
  const url = `${SITE_URL}/events/${props.slug}`;
  const online = props.format === "online";

  const location = online
    ? {
        "@type": "VirtualLocation",
        url: props.registrationUrl ?? url,
      }
    : {
        "@type": "Place",
        name: props.venueName ?? `${props.city ?? "Utah"}, UT`,
        address: {
          "@type": "PostalAddress",
          addressLocality: props.city ?? undefined,
          addressRegion: "UT",
          addressCountry: "US",
          streetAddress: props.venueAddress ?? undefined,
        },
      };

  const offers =
    props.priceCents != null
      ? {
          "@type": "Offer",
          price: (props.priceCents / 100).toFixed(2),
          priceCurrency: "USD",
          url: props.registrationUrl ?? url,
          availability:
            props.registrationState === "open"
              ? "https://schema.org/InStock"
              : "https://schema.org/LimitedAvailability",
        }
      : undefined;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Event",
        name: props.title,
        description: props.description?.slice(0, 500) ?? undefined,
        startDate: props.startsAt.toISOString(),
        endDate: props.endsAt?.toISOString(),
        eventAttendanceMode: online
          ? "https://schema.org/OnlineEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
        eventStatus:
          props.status === "cancelled"
            ? "https://schema.org/EventCancelled"
            : props.status === "postponed"
              ? "https://schema.org/EventPostponed"
              : "https://schema.org/EventScheduled",
        location,
        url,
        ...(props.imageUrl
          ? { image: [`${SITE_URL}${props.imageUrl}`] }
          : { image: [`${SITE_URL}/images/home/utah-esports-banner-1.jpg`] }),
        ...(offers ? { offers } : {}),
        ...(props.organizerName
          ? { organizer: { "@type": "Organization", name: props.organizerName, url: SITE_URL } }
          : {}),
      }}
    />
  );
}
