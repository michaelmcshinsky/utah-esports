import { z } from "zod";
import {
  AGE_POLICIES,
  ENTRY_MODES,
  EVENT_FORMATS,
  EVENT_STATUSES,
  EVENT_TYPES,
  PLATFORMS,
  REGISTRATION_STATES,
  SKILL_LEVELS,
} from "./domain.js";

/**
 * Query-string contract for /explore and /api/search.
 *
 * One filter system backs list, calendar, and map views — never three.
 * Parsing is lenient: unknown values are dropped rather than erroring so a
 * hand-edited URL degrades to a broader result set instead of a 400.
 */

const csv = (schema: z.ZodTypeAny) =>
  z
    .string()
    .optional()
    .transform((v) =>
      (v ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .pipe(z.array(schema));

export const eventSearchFilterSchema = z.object({
  q: z.string().trim().max(120).optional(),
  games: csv(z.string().max(80)),
  types: csv(z.enum(EVENT_TYPES)),
  formats: csv(z.enum(EVENT_FORMATS)),
  platforms: csv(z.enum(PLATFORMS)),
  skills: csv(z.enum(SKILL_LEVELS)),
  ages: csv(z.enum(AGE_POLICIES)),
  entryModes: csv(z.enum(ENTRY_MODES)),
  registration: csv(z.enum(REGISTRATION_STATES)),
  city: z.string().trim().max(80).optional(),
  region: z.string().trim().max(40).optional(),
  radiusKm: z.coerce.number().min(1).max(400).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  freeOnly: z.coerce.boolean().optional(),
  beginnerOnly: z.coerce.boolean().optional(),
  youthOnly: z.coerce.boolean().optional(),
  hideStale: z.coerce.boolean().default(true),
  status: csv(z.enum(EVENT_STATUSES)).optional(),
  sort: z.enum(["soonest", "recently_added", "distance"]).default("soonest"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type EventSearchFilter = z.infer<typeof eventSearchFilterSchema>;

export const DEFAULT_FILTERS: EventSearchFilter = eventSearchFilterSchema.parse({});

/** Build a query string that round-trips through the schema. */
export function serializeFilters(f: Partial<EventSearchFilter>): string {
  const params = new URLSearchParams();
  const set = (key: string, value: string | undefined | null) => {
    if (value) params.set(key, value);
  };
  const setList = (key: string, values: readonly string[] | undefined) => {
    if (values?.length) params.set(key, values.join(","));
  };
  set("q", f.q);
  setList("games", f.games);
  setList("types", f.types);
  setList("formats", f.formats);
  setList("platforms", f.platforms);
  setList("skills", f.skills);
  setList("ages", f.ages);
  setList("entryModes", f.entryModes);
  setList("registration", f.registration);
  set("city", f.city);
  set("region", f.region);
  if (f.radiusKm) params.set("radiusKm", String(f.radiusKm));
  if (f.lat != null) params.set("lat", f.lat.toFixed(4));
  if (f.lng != null) params.set("lng", f.lng.toFixed(4));
  set("from", f.from);
  set("to", f.to);
  if (f.freeOnly) params.set("freeOnly", "true");
  if (f.beginnerOnly) params.set("beginnerOnly", "true");
  if (f.youthOnly) params.set("youthOnly", "true");
  if (f.hideStale === false) params.set("hideStale", "false");
  setList("status", f.status);
  if (f.sort && f.sort !== "soonest") params.set("sort", f.sort);
  if (f.page && f.page > 1) params.set("page", String(f.page));
  if (f.pageSize && f.pageSize !== 20) params.set("pageSize", String(f.pageSize));
  return params.toString();
}

export function parseFilters(searchParams: URLSearchParams | Record<string, string | string[] | undefined>): EventSearchFilter {
  const flat: Record<string, string> = {};
  if (searchParams instanceof URLSearchParams) {
    searchParams.forEach((value, key) => {
      flat[key] = value;
    });
  } else {
    for (const [key, value] of Object.entries(searchParams)) {
      if (Array.isArray(value)) flat[key] = value.join(",");
      else if (typeof value === "string") flat[key] = value;
    }
  }
  const parsed = eventSearchFilterSchema.safeParse(flat);
  return parsed.success ? parsed.data : DEFAULT_FILTERS;
}

/** Row shape the matcher expects — keeps the pure logic DB-agnostic. */
export type FilterableEvent = {
  title: string;
  description: string | null;
  startsAt: Date;
  updatedAt?: Date | null;
  format: string | null;
  eventType: string | null;
  city: string | null;
  region: string | null;
  lat: number | null;
  lng: number | null;
  agePolicy: string | null;
  skillLevel: string | null;
  entryMode: string | null;
  platforms: string[];
  gameSlugs: string[];
  priceCents: number | null;
  registrationState: string | null;
  beginnerFriendly: boolean;
  youthProgram: boolean;
  lastConfirmedAt: Date | null;
  status: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Listings not re-confirmed within this window are considered stale. */
export const STALE_AFTER_DAYS = 120;

/** Haversine distance in kilometers. */
export function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export type MatchResult = { matches: boolean; distance: number | null };

export function matchesFilter(
  event: FilterableEvent,
  filter: EventSearchFilter,
  _now = new Date(),
): MatchResult {
  if (event.status === "cancelled" || event.status === "archived") {
    return { matches: false, distance: null };
  }
  if (event.status === "draft" || event.status === "completed") {
    return { matches: false, distance: null };
  }
  if (
    filter.status?.length &&
    !filter.status.includes(event.status as never) &&
    event.status !== "needs_verification"
  ) {
    return { matches: false, distance: null };
  }
  if (filter.q?.length) {
    const haystack = `${event.title} ${event.description ?? ""}`.toLowerCase();
    const terms = filter.q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.every((t) => haystack.includes(t))) {
      return { matches: false, distance: null };
    }
  }
  if (filter.games.length && !filter.games.some((g) => event.gameSlugs.includes(g))) {
    return { matches: false, distance: null };
  }
  if (filter.types.length && (!event.eventType || !filter.types.includes(event.eventType))) {
    return { matches: false, distance: null };
  }
  if (filter.formats.length && (!event.format || !filter.formats.includes(event.format))) {
    return { matches: false, distance: null };
  }
  if (
    filter.platforms.length &&
    !filter.platforms.some((p) => event.platforms.includes(p))
  ) {
    return { matches: false, distance: null };
  }
  if (
    filter.skills.length &&
    (!event.skillLevel || !filter.skills.includes(event.skillLevel)) &&
    !(filter.skills.includes("beginner_friendly") && event.beginnerFriendly)
  ) {
    return { matches: false, distance: null };
  }
  if (filter.ages.length && (!event.agePolicy || !filter.ages.includes(event.agePolicy))) {
    return { matches: false, distance: null };
  }
  if (
    filter.entryModes.length &&
    (!event.entryMode || !filter.entryModes.includes(event.entryMode))
  ) {
    return { matches: false, distance: null };
  }
  if (
    filter.registration.length &&
    (!event.registrationState ||
      !filter.registration.includes(event.registrationState as never))
  ) {
    return { matches: false, distance: null };
  }
  if (filter.freeOnly && event.priceCents != null && event.priceCents > 0) {
    return { matches: false, distance: null };
  }
  if (filter.beginnerOnly && !event.beginnerFriendly) {
    return { matches: false, distance: null };
  }
  if (filter.youthOnly && !event.youthProgram) {
    return { matches: false, distance: null };
  }
  if (filter.from) {
    const from = new Date(filter.from);
    if (event.startsAt < from) return { matches: false, distance: null };
  }
  if (filter.to) {
    const to = new Date(filter.to);
    if (event.startsAt > to) return { matches: false, distance: null };
  }
  if (filter.region && event.region !== filter.region) {
    return { matches: false, distance: null };
  }
  if (filter.city?.length) {
    const city = filter.city.toLowerCase();
    if (!event.city?.toLowerCase().includes(city)) {
      return { matches: false, distance: null };
    }
  }

  let distance: number | null = null;
  if (
    filter.lat != null &&
    filter.lng != null &&
    event.lat != null &&
    event.lng != null
  ) {
    distance = distanceKm(filter.lat, filter.lng, event.lat, event.lng);
    if (filter.radiusKm != null && distance > filter.radiusKm) {
      return { matches: false, distance };
    }
  }

  return { matches: true, distance };
}

export function filterAndSort(
  events: FilterableEvent[],
  filter: EventSearchFilter,
  now = new Date(),
): Array<FilterableEvent & { distance: number | null }> {
  const matched: Array<FilterableEvent & { distance: number | null }> = [];
  for (const event of events) {
    const result = matchesFilter(event, filter, now);
    if (result.matches) matched.push({ ...event, distance: result.distance });
  }
  const freshnessPenalty = (e: FilterableEvent): number => {
    if (!e.lastConfirmedAt) return 2;
    const days = (now.getTime() - e.lastConfirmedAt.getTime()) / DAY_MS;
    if (days <= 30) return 0;
    if (days <= 90) return 1;
    if (days <= 180) return 3;
    return 6;
  };
  matched.sort((a, b) => {
    if (filter.sort === "distance") {
      const da = a.distance ?? Number.POSITIVE_INFINITY;
      const db = b.distance ?? Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return a.startsAt.getTime() - b.startsAt.getTime();
    }
    if (filter.sort === "recently_added") {
      const ta = a.updatedAt?.getTime() ?? a.startsAt.getTime();
      const tb = b.updatedAt?.getTime() ?? b.startsAt.getTime();
      if (ta !== tb) return tb - ta;
      return a.startsAt.getTime() - b.startsAt.getTime();
    }
    const fa = filter.hideStale ? freshnessPenalty(a) : 0;
    const fb = filter.hideStale ? freshnessPenalty(b) : 0;
    // Confirmed-soon events first, then soonest start; stale sinks below.
    const bucketA = Math.floor(a.startsAt.getTime() / (7 * DAY_MS)) + fa * 100;
    const bucketB = Math.floor(b.startsAt.getTime() / (7 * DAY_MS)) + fb * 100;
    if (bucketA !== bucketB) return bucketA - bucketB;
    return a.startsAt.getTime() - b.startsAt.getTime();
  });
  return matched;
}

/** Preset chips used on the homepage and explore toolbar. */
export type QuickPreset = {
  id: string;
  label: string;
  patch: Partial<EventSearchFilter>;
};

export function startOfToday(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfToday(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function endOfWeek(now = new Date()): Date {
  const d = startOfToday(now);
  const daysUntilSunday = 7 - d.getDay();
  d.setDate(d.getDate() + daysUntilSunday);
  d.setHours(23, 59, 59, 999);
  return d;
}

export const QUICK_PRESETS: QuickPreset[] = [
  {
    id: "tonight",
    label: "Tonight",
    patch: {
      from: undefined,
      to: undefined,
    },
  },
  {
    id: "weekend",
    label: "This weekend",
    patch: {},
  },
  { id: "beginner", label: "Beginner-friendly", patch: { beginnerOnly: true } },
  { id: "free", label: "Free", patch: { freeOnly: true } },
  { id: "youth", label: "Youth programs", patch: { youthOnly: true } },
  { id: "online", label: "Online", patch: { formats: ["online"] } },
];

/** Resolve a preset id into concrete filter bounds. */
export function applyPreset(
  id: string,
  filter: EventSearchFilter,
  now = new Date(),
): EventSearchFilter {
  switch (id) {
    case "tonight":
      return {
        ...filter,
        from: startOfToday(now).toISOString(),
        to: endOfToday(now).toISOString(),
      };
    case "weekend": {
      // Upcoming Friday–Sunday (or rest of this week if already Fri+).
      const today = startOfToday(now);
      const day = today.getDay();
      const upcomingFriday = new Date(today);
      const daysUntilFriday = (5 - day + 7) % 7;
      upcomingFriday.setDate(today.getDate() + daysUntilFriday);
      const sunday = new Date(upcomingFriday);
      sunday.setDate(upcomingFriday.getDate() + 2);
      sunday.setHours(23, 59, 59, 999);
      const from = day >= 5 ? today : upcomingFriday;
      return {
        ...filter,
        from: from.toISOString(),
        to: sunday.toISOString(),
      };
    }
    case "beginner":
      return { ...filter, beginnerOnly: true };
    case "free":
      return { ...filter, freeOnly: true };
    case "youth":
      return { ...filter, youthOnly: true };
    case "online":
      return { ...filter, formats: ["online"] };
    default:
      return filter;
  }
}
