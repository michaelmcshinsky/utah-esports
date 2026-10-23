import { z } from "zod";
import {
  AGE_POLICIES,
  EVENT_FORMATS,
  EVENT_TYPES,
  ORG_KINDS,
  REGISTRATION_STATES,
  SKILL_LEVELS,
} from "@utah-esports/core";

/**
 * Client-side form schemas (react-hook-form + zodResolver).
 *
 * These mirror the *form field shapes* — CSV strings, datetime-local values,
 * empty-string-as-blank — while the API keeps validating payloads with the
 * stricter schemas in @utah-esports/core (server is the contract; this is
 * the UX layer: per-field messages as you type/blur).
 */

const urlOrBlank = z.union([z.literal(""), z.string().url("Enter a valid URL")]);
const optionalUrl = z.union([z.literal(""), z.string().url("Enter a valid URL")]).optional();

const localDateTime = (label: string) =>
  z
    .string()
    .min(1, `${label} is required`)
    .refine((v) => !Number.isNaN(Date.parse(v)), `${label} isn't a valid date & time`);

const optionalLocalDateTime = z.union([
  z.literal(""),
  z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "That date isn't valid")
    .optional(),
]);

const priceInput = z
  .string()
  .optional()
  .refine(
    (v) => v === undefined || v === "" || (Number.isFinite(Number(v)) && Number(v) >= 0),
    "Enter a valid price",
  );

// ---------------------------------------------------------------- events

export const submitEventFormSchema = z.object({
  title: z.string().trim().min(3, "Give the event a title").max(140),
  url: z.string().url("Add a link players can use to register or learn more"),
  eventType: z.enum(EVENT_TYPES),
  format: z.enum(EVENT_FORMATS),
  startsAt: localDateTime("Start time"),
  endsAt: optionalLocalDateTime,
  gameNames: z
    .string()
    .trim()
    .min(1, "List at least one game (comma-separated)")
    .max(300),
  city: z.string().trim().max(80).optional(),
  agePolicy: z.enum(AGE_POLICIES),
  skillLevel: z.enum(SKILL_LEVELS),
  beginnerFriendly: z.boolean(),
  youthProgram: z.boolean(),
  priceDollars: priceInput,
  registrationState: z.enum(REGISTRATION_STATES),
  description: z.string().trim().max(5000).optional(),
  contactName: z.string().trim().min(2, "Who should players contact?").max(80),
  contactEmail: z.string().email("Organizers need a reachable email").max(200),
  notes: z.string().trim().max(2000).optional(),
});

export type SubmitEventFormValues = z.infer<typeof submitEventFormSchema>;

/** Dashboard create/edit — extends the public form with status + series fields. */
export const eventFormSchema = submitEventFormSchema.extend({
  status: z.enum([
    "draft",
    "published",
    "postponed",
    "cancelled",
    "completed",
    "needs_verification",
  ]),
  /** Gated by the "Repeat weekly" checkbox (create mode only). */
  repeatWeekly: z.boolean(),
  recurrenceHint: z.string().trim().max(200).optional(),
  seriesEndsOn: z.union([
    z.literal(""),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date"),
  ]),
  registrationDeadline: optionalLocalDateTime,
});

export type EventFormValues = z.infer<typeof eventFormSchema>;

// ---------------------------------------------------------------- orgs

export const createOrganizationFormSchema = z.object({
  name: z.string().trim().min(2, "Name your organization").max(140),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, dashes")
    .max(80),
  kind: z.enum(ORG_KINDS),
  contactEmail: z.string().email("A contact email is required").max(200),
  city: z.string().trim().max(80).optional(),
  websiteUrl: urlOrBlank,
  description: z.string().trim().max(3000).optional(),
});

export type CreateOrganizationFormValues = z.infer<typeof createOrganizationFormSchema>;

export const claimFormSchema = z.object({
  proofUrl: z.string().url("Link to a page showing your affiliation"),
  contactEmail: z.string().email("We need a way to reach you").max(200),
  message: z.string().trim().max(2000).optional(),
});

export type ClaimFormValues = z.infer<typeof claimFormSchema>;

// ---------------------------------------------------------------- accounts

export const signInFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(200),
});

export type SignInFormValues = z.infer<typeof signInFormSchema>;

export const searchHeroFormSchema = z.object({
  q: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
});

export type SearchHeroFormValues = z.infer<typeof searchHeroFormSchema>;

/**
 * Explore's date/search strip. `from`/`to` arrive as `yyyy-MM-dd` from
 * date inputs; the handler expands them to local day bounds in full ISO
 * (the shared filter schema needs offsets — a bare date was silently
 * dropped before this conversion existed).
 */
export const dateRangeFormSchema = z.object({
  q: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
  from: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")]),
  to: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")]),
});

export type DateRangeFormValues = z.infer<typeof dateRangeFormSchema>;

export const savedSearchFormSchema = z.object({
  name: z.string().trim().min(1, "Give the search a name").max(80),
});

export type SavedSearchFormValues = z.infer<typeof savedSearchFormSchema>;

/**
 * Report dialog. The core API schema keeps contactEmail `.email().nullish()`
 * (server contract) — but RHF submits `""` for an untouched input, which
 * would fail `.email()`. This form schema accepts blank-as-optional and the
 * submit handler coerces "" → null before POST.
 */
export const reportFormSchema = z.object({
  reason: z.enum([
    "incorrect_info",
    "event_cancelled",
    "broken_link",
    "unsafe",
    "spam",
    "other",
  ]),
  details: z.string().trim().max(2000, "Keep details under 2000 characters").optional(),
  contactEmail: z.union([z.literal(""), z.string().email("Enter a valid email address")]),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;

// ---------------------------------------------------------------- teams

export const teamFormSchema = z.object({
  name: z.string().trim().min(2, "Name the team").max(140),
  pathway: z.enum(["high_school", "collegiate", "youth", "independent_team"]),
  institution: z.string().trim().max(140).optional(),
  city: z.string().trim().max(80).optional(),
  tryoutInfo: z.string().trim().max(500, "Keep tryout info under 500 characters").optional(),
  websiteUrl: urlOrBlank,
  description: z.string().trim().max(1000).optional(),
  facebookUrl: optionalUrl,
  twitterUrl: optionalUrl,
  twitchUrl: optionalUrl,
  instagramUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  /** Discord role id assigned to linked roster members (advanced). */
  discordRoleId: z.union([
    z.literal(""),
    z.string().trim().regex(/^\d{5,25}$/, "Discord role ids are numeric"),
  ]),
});

export type TeamFormValues = z.infer<typeof teamFormSchema>;

export const teamPatchSchema = teamFormSchema.partial();

