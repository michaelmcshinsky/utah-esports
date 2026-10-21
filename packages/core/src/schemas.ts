import { z } from "zod";
import {
  AGE_POLICIES,
  ENTRY_MODES,
  EVENT_FORMATS,
  EVENT_TYPES,
  ORG_KINDS,
  PLATFORMS,
  REGISTRATION_STATES,
  SCHOOL_PATHWAYS,
  SKILL_LEVELS,
} from "./domain.js";

/**
 * Form + API validation schemas. These are the trust boundary for
 * untrusted input: submissions, imports, and organizer edits all pass
 * through here before touching the database.
 */

export const moneySchema = z.object({
  amountCents: z.number().int().min(0).max(100_000_00).nullable().default(null),
  label: z.string().trim().max(40).nullable().default(null),
});

export const eventSubmissionSchema = z.object({
  title: z.string().trim().min(3, "Give the event a title").max(140),
  description: z.string().trim().max(5000).nullish(),
  url: z.string().url("Add a link players can use").max(500),
  eventType: z.enum(EVENT_TYPES),
  format: z.enum(EVENT_FORMATS),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }).nullish(),
  gameNames: z.array(z.string().trim().min(1).max(80)).min(1, "Pick at least one game"),
  venueId: z.string().uuid().nullish(),
  onlineUrl: z.string().url().max(500).nullish(),
  address: z.string().trim().max(200).nullish(),
  city: z.string().trim().max(80).nullish(),
  agePolicy: z.enum(AGE_POLICIES).default("unknown"),
  skillLevel: z.enum(SKILL_LEVELS).default("unknown"),
  entryMode: z.enum(ENTRY_MODES).default("individual"),
  platforms: z.array(z.enum(PLATFORMS)).default([]),
  beginnerFriendly: z.boolean().default(false),
  youthProgram: z.boolean().default(false),
  priceCents: z.number().int().min(0).max(100_000_00).nullish(),
  priceNote: z.string().trim().max(120).nullish(),
  venueFeeCents: z.number().int().min(0).max(100_000_00).nullish(),
  registrationUrl: z.string().url().max(500).nullish(),
  registrationState: z.enum(REGISTRATION_STATES).default("unknown"),
  registrationDeadline: z.string().datetime({ offset: true }).nullish(),
  contactName: z.string().trim().min(2).max(80),
  contactEmail: z.string().email("Add a contact email organizers can reply to").max(200),
  notes: z.string().trim().max(2000).nullish(),
});

export type EventSubmissionInput = z.infer<typeof eventSubmissionSchema>;

export const eventEditSchema = eventSubmissionSchema.extend({
  status: z
    .enum(["draft", "published", "postponed", "cancelled", "completed", "needs_verification"])
    .default("draft"),
  organizationId: z.string().uuid().nullish(),
  seriesId: z.string().uuid().nullish(),
});

export type EventEditInput = z.infer<typeof eventEditSchema>;

export const communitySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and dashes")
    .max(80),
  description: z.string().trim().max(3000).nullish(),
  welcomeText: z.string().trim().max(2000).nullish(),
  city: z.string().trim().max(80).nullish(),
  region: z.string().trim().max(40).nullish(),
  primaryUrl: z.string().url().max(500).nullish(),
  discordUrl: z.string().url().max(500).nullish(),
  facebookUrl: z.string().url().max(500).nullish(),
  websiteUrl: z.string().url().max(500).nullish(),
  codeOfConductUrl: z.string().url().max(500).nullish(),
  contactEmail: z.string().email().max(200).nullish(),
  gameSlugs: z.array(z.string().max(80)).default([]),
});

export type CommunityInput = z.infer<typeof communitySchema>;

export const venueSchema = z.object({
  name: z.string().trim().min(2).max(140),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  description: z.string().trim().max(3000).nullish(),
  address: z.string().trim().max(200).nullish(),
  city: z.string().trim().max(80).nullish(),
  state: z.string().trim().max(40).default("UT"),
  postalCode: z.string().trim().max(20).nullish(),
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
  websiteUrl: z.string().url().max(500).nullish(),
  phone: z.string().trim().max(40).nullish(),
  hours: z.string().trim().max(500).nullish(),
  equipmentNotes: z.string().trim().max(2000).nullish(),
  byodRequired: z.boolean().default(false),
  agePolicy: z.enum(AGE_POLICIES).default("unknown"),
  accessibilityNotes: z.string().trim().max(2000).nullish(),
  typicalCostNotes: z.string().trim().max(500).nullish(),
});

export type VenueInput = z.infer<typeof venueSchema>;

export const organizationCreateSchema = z.object({
  name: z.string().trim().min(2).max(140),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(80),
  kind: z.enum(ORG_KINDS),
  description: z.string().trim().max(3000).nullish(),
  websiteUrl: z.string().url().max(500).nullish(),
  contactEmail: z.string().email().max(200),
  city: z.string().trim().max(80).nullish(),
});

export type OrganizationCreateInput = z.infer<typeof organizationCreateSchema>;

export const organizationClaimSchema = z.object({
  organizationId: z.string().uuid(),
  proofUrl: z.string().url("Link to a public page that shows your affiliation").max(500),
  message: z.string().trim().max(2000).nullish(),
  contactEmail: z.string().email().max(200),
});

export type OrganizationClaimInput = z.infer<typeof organizationClaimSchema>;

export const schoolProgramSchema = z.object({
  name: z.string().trim().min(2).max(140),
  pathway: z.enum(SCHOOL_PATHWAYS),
  institution: z.string().trim().min(2).max(140),
  city: z.string().trim().max(80).nullish(),
  websiteUrl: z.string().url().max(500).nullish(),
  contactEmail: z.string().email().max(200).nullish(),
  description: z.string().trim().max(3000).nullish(),
  gameSlugs: z.array(z.string().max(80)).default([]),
});

export type SchoolProgramInput = z.infer<typeof schoolProgramSchema>;

export const userPreferencesSchema = z.object({
  displayName: z.string().trim().min(1).max(60).nullish(),
  city: z.string().trim().max(80).nullish(),
  radiusKm: z.number().int().min(1).max(400).default(40),
  gameSlugs: z.array(z.string().max(80)).default([]),
  eventTypes: z.array(z.enum(EVENT_TYPES)).default([]),
  digestDayOfWeek: z.number().int().min(0).max(6).default(1),
  digestEnabled: z.boolean().default(true),
  reminderEnabled: z.boolean().default(true),
  changeNotificationsEnabled: z.boolean().default(true),
  quietHoursStart: z.number().int().min(0).max(23).default(22),
  quietHoursEnd: z.number().int().min(0).max(23).default(8),
});

export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;

export const reportSchema = z.object({
  targetType: z.enum(["event", "community", "venue", "organization"]),
  targetId: z.string().uuid(),
  reason: z.enum([
    "incorrect_info",
    "event_cancelled",
    "broken_link",
    "unsafe",
    "spam",
    "other",
  ]),
  details: z.string().trim().max(2000).nullish(),
  contactEmail: z.string().email().max(200).nullish(),
});

export type ReportInput = z.infer<typeof reportSchema>;

export const savedSearchSchema = z.object({
  name: z.string().trim().min(1).max(80),
  query: z.string().trim().min(1).max(2000),
  notify: z.boolean().default(true),
});

export type SavedSearchInput = z.infer<typeof savedSearchSchema>;
