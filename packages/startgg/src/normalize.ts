import type { StartggEvent } from "./types.js";

/**
 * Normalizer: start.gg event → our event draft fields.
 *
 * Deliberately conservative: only fields start.gg actually owns are set.
 * Missing data stays null so the site can show "not provided" instead of
 * inventing fees, ages, or registration state.
 */

export type NormalizedStartggEvent = {
  externalId: string;
  slug: string;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  format: "in_person" | "online" | "hybrid";
  city: string | null;
  region: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
  onlineUrl: string | null;
  registrationUrl: string;
  registrationDeadline: Date | null;
  hostName: string | null;
  hostExternalId: string | null;
  videogameName: string | null;
  videogameSlug: string | null;
  videogameId: string | null;
  imageUrl: string | null;
  sourceUrl: string;
};

export function normalizeStartggEvent(event: StartggEvent): NormalizedStartggEvent {
  const startsAt = new Date(event.startAt * 1000);
  const endsAt = event.endAt ? new Date(event.endAt * 1000) : null;
  const venue = event.venue;
  const format: NormalizedStartggEvent["format"] = event.isOnline ? "online" : "in_person";
  const image =
    event.images?.find((i) => i.type === "profile")?.url ?? event.images?.[0]?.url ?? null;
  return {
    externalId: event.id,
    slug: event.slug,
    title: event.name,
    startsAt,
    endsAt,
    format,
    city: venue?.city ?? event.city ?? null,
    region: event.region ?? null,
    state: venue?.state ?? event.addrState ?? null,
    lat: venue?.latitude ?? null,
    lng: venue?.longitude ?? null,
    onlineUrl: event.isOnline ? `https://start.gg/tournament/${event.slug}` : null,
    registrationUrl: `https://start.gg/tournament/${event.slug}`,
    registrationDeadline: event.registrationDeadline
      ? new Date(event.registrationDeadline * 1000)
      : null,
    hostName: event.host?.name ?? null,
    hostExternalId: event.host?.id ?? null,
    videogameName: event.videogame?.name ?? null,
    videogameSlug: event.videogame?.slug ?? null,
    videogameId: event.videogame?.id ?? null,
    imageUrl: image,
    sourceUrl: `https://start.gg/tournament/${event.slug}`,
  };
}

/**
 * Best-effort match of a start.gg videogame onto our games table.
 * Exact slug first, then a loose name comparison.
 */
export function matchGameSlug(
  vg: { slug: string | null; name: string },
  known: Array<{ slug: string; name: string; startggVideogameSlug: string | null }>,
): string | null {
  if (vg.slug) {
    const bySlug = known.find(
      (g) => g.startggVideogameSlug === vg.slug || g.slug === vg.slug,
    );
    if (bySlug) return bySlug.slug;
  }
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const target = normalize(vg.name);
  const byName = known.find((g) => normalize(g.name) === target);
  return byName?.slug ?? null;
}
