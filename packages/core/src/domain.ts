/**
 * Shared domain vocabulary for Utah Esports.
 *
 * These enums and constants are the contract between the database schema,
 * the web UI, workers, and the Discord bot. Publication state is deliberately
 * separate from registration state so a cancelled event can keep its
 * registration history and a draft can hold an open registration link.
 */

export const EVENT_TYPES = [
  "tournament",
  "casual",
  "watch_party",
  "workshop",
  "tryout",
  "league",
  "other",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STATUSES = [
  "draft",
  "published",
  "postponed",
  "cancelled",
  "completed",
  "needs_verification",
  "archived",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

/** Statuses shown on the public site by default. */
export const PUBLIC_EVENT_STATUSES: readonly EventStatus[] = [
  "published",
  "postponed",
  "needs_verification",
];

export const REGISTRATION_STATES = [
  "open",
  "closing_soon",
  "closed",
  "full",
  "waitlist",
  "unknown",
] as const;
export type RegistrationState = (typeof REGISTRATION_STATES)[number];

export const EVENT_FORMATS = [
  "in_person",
  "online",
  "hybrid",
] as const;
export type EventFormat = (typeof EVENT_FORMATS)[number];

export const ENTRY_MODES = ["individual", "team", "either"] as const;
export type EntryMode = (typeof ENTRY_MODES)[number];

export const SKILL_LEVELS = [
  "beginner_friendly",
  "open",
  "intermediate",
  "advanced",
  "competitive",
  "unknown",
] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const AGE_POLICIES = [
  "all_ages",
  "teen",
  "18_plus",
  "21_plus",
  "unknown",
] as const;
export type AgePolicy = (typeof AGE_POLICIES)[number];

export const PLATFORMS = [
  "pc",
  "playstation",
  "xbox",
  "switch",
  "multi",
  "other",
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const ORG_ROLES = ["owner", "editor", "viewer"] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const ORG_KINDS = [
  "community",
  "venue",
  "school",
  "collegiate",
  "youth",
  "team",
  "organizer",
  "other",
] as const;
export type OrgKind = (typeof ORG_KINDS)[number];

export const SCHOOL_PATHWAYS = [
  "high_school",
  "collegiate",
  "youth",
  "independent_team",
] as const;
export type SchoolPathway = (typeof SCHOOL_PATHWAYS)[number];

export const NOTIFICATION_CHANNELS = ["email", "discord"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const FOLLOW_KINDS = ["game", "community", "organization", "venue"] as const;
export type FollowKind = (typeof FOLLOW_KINDS)[number];

export const SOURCE_KINDS = [
  "organizer",
  "startgg",
  "legacy_jekyll",
  "import",
  "community",
  "manual",
] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

/** Utah region buckets used for coarse browsing (not a boundary definition). */
export const UTAH_REGIONS = [
  "salt_lake_valley",
  "utah_valley",
  "davis_weber",
  "cache_valley",
  "southern_utah",
  "other",
] as const;
export type UtahRegion = (typeof UTAH_REGIONS)[number];

export const REGION_LABELS: Record<UtahRegion, string> = {
  salt_lake_valley: "Salt Lake Valley",
  utah_valley: "Utah Valley",
  davis_weber: "Davis & Weber",
  cache_valley: "Cache Valley",
  southern_utah: "Southern Utah",
  other: "Other Utah",
};

/** Approximate region centers for distance sorting and map defaults. */
export const REGION_CENTERS: Record<UtahRegion, { lat: number; lng: number }> = {
  salt_lake_valley: { lat: 40.7608, lng: -111.891 },
  utah_valley: { lat: 40.2338, lng: -111.6585 },
  davis_weber: { lat: 41.1737, lng: -111.9658 },
  cache_valley: { lat: 41.7355, lng: -111.8344 },
  southern_utah: { lat: 37.0965, lng: -113.5684 },
  other: { lat: 39.321, lng: -111.0937 },
};

/** Rough city → region map for seed data and URL aliases. */
export const CITY_REGIONS: Record<string, UtahRegion> = {
  "salt lake city": "salt_lake_valley",
  "slc": "salt_lake_valley",
  "west valley city": "salt_lake_valley",
  "west valley": "salt_lake_valley",
  "murray": "salt_lake_valley",
  "west jordan": "salt_lake_valley",
  "south jordan": "salt_lake_valley",
  "sandy": "salt_lake_valley",
  "orem": "utah_valley",
  "provo": "utah_valley",
  "pleasant grove": "utah_valley",
  "lehi": "utah_valley",
  "american fork": "utah_valley",
  "Spanish Fork": "utah_valley",
  "layton": "davis_weber",
  "ogden": "davis_weber",
  "clearfield": "davis_weber",
  "bountiful": "davis_weber",
  "logan": "cache_valley",
  "st george": "southern_utah",
  "st. george": "southern_utah",
  "cedar city": "southern_utah",
};

export function regionForCity(city: string | null | undefined): UtahRegion | null {
  if (!city) return null;
  return CITY_REGIONS[city.trim().toLowerCase()] ?? null;
}

export function isPublicStatus(status: EventStatus): boolean {
  return (PUBLIC_EVENT_STATUSES as readonly string[]).includes(status);
}

/** Essentials every published listing must carry to be considered trustworthy. */
export type ParticipationEssentials = {
  title: boolean;
  startsAt: boolean;
  format: boolean;
  locationOrOnline: boolean;
  registrationInfo: boolean;
};

export function missingEssentials(e: {
  title: string | null;
  startsAt: Date | null;
  format: EventFormat | null;
  venueId: string | null;
  onlineUrl: string | null;
  registrationUrl: string | null;
  registrationState: RegistrationState | null;
}): string[] {
  const missing: string[] = [];
  if (!e.title) missing.push("title");
  if (!e.startsAt) missing.push("starts_at");
  if (!e.format) missing.push("format");
  if (e.format !== "online" && !e.venueId) missing.push("venue_or_online");
  if (!e.registrationUrl && e.registrationState !== "unknown") {
    missing.push("registration");
  }
  if (!e.registrationUrl && !e.registrationState) missing.push("registration");
  return missing;
}
