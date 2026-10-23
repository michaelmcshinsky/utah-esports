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

export function isPublicStatus(status: EventStatus): boolean {
  return (PUBLIC_EVENT_STATUSES as readonly string[]).includes(status);
}
