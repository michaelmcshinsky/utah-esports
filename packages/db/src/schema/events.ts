import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  agePolicyEnum,
  deadlinePrecisionEnum,
  entryModeEnum,
  eventFormatEnum,
  eventStatusEnum,
  eventTypeEnum,
  id,
  registrationStateEnum,
  skillLevelEnum,
  venues,
  createdAt,
  updatedAt,
} from "./core.js";
import { organizations } from "./orgs.js";

/**
 * Events are modeled as a series plus dated occurrences so a single night
 * can be cancelled or moved without corrupting a weekly meetup.
 *
 * City/region/lat/lng are denormalized onto the occurrence at publish time
 * so discovery filters never need a join to venues.
 */

export const eventSeries = pgTable(
  "event_series",
  {
    id: id(),
    title: text("title").notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    venueId: uuid("venue_id").references(() => venues.id, { onDelete: "set null" }),
    eventType: eventTypeEnum("event_type").notNull().default("casual"),
    format: eventFormatEnum("format").notNull().default("in_person"),
    description: text("description"),
    /** Human-readable recurrence hint, e.g. "Every Thursday 7pm". */
    recurrenceHint: text("recurrence_hint"),
    seriesEndsOn: date("series_ends_on"),
    maxOccurrences: integer("max_occurrences").default(52),
    sourceId: uuid("source_id"),
    createdById: uuid("created_by"),
    status: eventStatusEnum("status").notNull().default("published"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("event_series_org_idx").on(t.organizationId)],
);

export const eventOccurrences = pgTable(
  "event_occurrences",
  {
    id: id(),
    /** Public URL slug, unique across the site. */
    slug: text("slug").notNull(),
    seriesId: uuid("series_id").references(() => eventSeries.id, { onDelete: "set null" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    venueId: uuid("venue_id").references(() => venues.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description"),
    eventType: eventTypeEnum("event_type").notNull().default("casual"),
    format: eventFormatEnum("format").notNull().default("in_person"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    /** Denormalized location for fast filtering. */
    city: text("city"),
    region: text("region"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    onlineUrl: text("online_url"),
    imageUrl: text("image_url"),
    agePolicy: agePolicyEnum("age_policy").notNull().default("unknown"),
    skillLevel: skillLevelEnum("skill_level").notNull().default("unknown"),
    entryMode: entryModeEnum("entry_mode").notNull().default("individual"),
    platforms: text("platforms").array().notNull().default(sql`'{}'::text[]`),
    beginnerFriendly: boolean("beginner_friendly").notNull().default(false),
    youthProgram: boolean("youth_program").notNull().default(false),
    priceCents: integer("price_cents"),
    priceNote: text("price_note"),
    venueFeeCents: integer("venue_fee_cents"),
    registrationUrl: text("registration_url"),
    registrationState: registrationStateEnum("registration_state").notNull().default("unknown"),
    registrationDeadline: timestamp("registration_deadline", { withTimezone: true }),
    /** Whether the deadline is a calendar date or an exact timestamp. */
    registrationDeadlinePrecision: deadlinePrecisionEnum("registration_deadline_precision"),
    /** Late fee start date/time (if applicable). */
    lateFeeStartsAt: timestamp("late_fee_starts_at", { withTimezone: true }),
    lateFeePrecision: deadlinePrecisionEnum("late_fee_precision"),
    lateFeeNote: text("late_fee_note"),
    /** External URL columns for common event links. */
    ticketUrl: text("ticket_url"),
    scheduleUrl: text("schedule_url"),
    resultsUrl: text("results_url"),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    bringNotes: text("bring_notes"),
    parkingNotes: text("parking_notes"),
    firstTimeNotes: text("first_time_notes"),
    scheduleNotes: text("schedule_notes"),
    status: eventStatusEnum("status").notNull().default("draft"),
    statusNotice: text("status_notice"),
    sourceId: uuid("source_id"),
    sourceRecordId: uuid("source_record_id"),
    lastObservedAt: timestamp("last_observed_at", { withTimezone: true }),
    lastConfirmedAt: timestamp("last_confirmed_at", { withTimezone: true }),
    confirmedBy: uuid("confirmed_by"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdById: uuid("created_by"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("event_occurrences_slug_idx").on(t.slug),
    index("event_occurrences_starts_at_idx").on(t.startsAt),
    index("event_occurrences_status_starts_idx").on(t.status, t.startsAt),
    index("event_occurrences_org_idx").on(t.organizationId),
    index("event_occurrences_series_idx").on(t.seriesId),
    index("event_occurrences_city_idx").on(t.city),
    index("event_occurrences_region_idx").on(t.region),
    index("event_occurrences_source_record_idx").on(t.sourceRecordId),
  ],
);

export const eventGames = pgTable(
  "event_games",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => eventOccurrences.id, { onDelete: "cascade" }),
    gameId: uuid("game_id").notNull(),
  },
  (t) => [uniqueIndex("event_games_pk").on(t.eventId, t.gameId)],
);

export const eventLinks = pgTable(
  "event_links",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => eventOccurrences.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    url: text("url").notNull(),
    kind: text("kind").notNull().default("other"),
  },
  (t) => [index("event_links_event_idx").on(t.eventId)],
);

/** Field-level provenance for the participation-critical fields. */
export const eventFieldSources = pgTable(
  "event_field_sources",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => eventOccurrences.id, { onDelete: "cascade" }),
    field: text("field").notNull(),
    value: text("value"),
    source: text("source").notNull(),
    lastObservedAt: timestamp("last_observed_at", { withTimezone: true }).notNull(),
    lastConfirmedAt: timestamp("last_confirmed_at", { withTimezone: true }),
    /** Set when an organizer override must beat older imports. */
    overrideOwner: uuid("override_owner"),
  },
  (t) => [
    uniqueIndex("event_field_sources_uniq").on(t.eventId, t.field),
  ],
);
