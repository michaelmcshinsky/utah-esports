import {
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Shared enums. Defined once so migrations stay consistent across modules.
 * Values match the string unions in @utah-esports/core.
 */

export const eventTypeEnum = pgEnum("event_type", [
  "tournament",
  "casual",
  "watch_party",
  "workshop",
  "tryout",
  "league",
  "other",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "postponed",
  "cancelled",
  "completed",
  "needs_verification",
  "archived",
]);

export const registrationStateEnum = pgEnum("registration_state", [
  "open",
  "closing_soon",
  "closed",
  "full",
  "waitlist",
  "unknown",
]);

export const eventFormatEnum = pgEnum("event_format", ["in_person", "online", "hybrid"]);

export const entryModeEnum = pgEnum("entry_mode", ["individual", "team", "either"]);

export const skillLevelEnum = pgEnum("skill_level", [
  "beginner_friendly",
  "open",
  "intermediate",
  "advanced",
  "competitive",
  "unknown",
]);

export const agePolicyEnum = pgEnum("age_policy", [
  "all_ages",
  "teen",
  "18_plus",
  "21_plus",
  "unknown",
]);

export const platformEnum = pgEnum("platform", [
  "pc",
  "playstation",
  "xbox",
  "switch",
  "multi",
  "other",
]);

export const orgRoleEnum = pgEnum("org_role", ["owner", "editor", "viewer"]);

export const orgKindEnum = pgEnum("org_kind", [
  "community",
  "venue",
  "school",
  "collegiate",
  "youth",
  "team",
  "organizer",
  "other",
]);

export const schoolPathwayEnum = pgEnum("school_pathway", [
  "high_school",
  "collegiate",
  "youth",
  "independent_team",
]);

export const sourceKindEnum = pgEnum("source_kind", [
  "organizer",
  "startgg",
  "legacy_jekyll",
  "import",
  "community",
  "manual",
]);

export const followKindEnum = pgEnum("follow_kind", [
  "game",
  "community",
  "organization",
  "venue",
]);

export const notificationChannelEnum = pgEnum("notification_channel", ["email", "discord"]);

export const listingStatusEnum = pgEnum("listing_status", [
  "published",
  "needs_verification",
  "hidden",
]);

export const utc = () => timestamp("at", { withTimezone: true }).notNull();
export const createdAt = () =>
  timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`);
export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`);

export const id = () => uuid("id").primaryKey().defaultRandom();

// ---------------------------------------------------------------------------
// Games
// ---------------------------------------------------------------------------

export const games = pgTable(
  "games",
  {
    id: id(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    family: text("family"),
    startggVideogameId: integer("startgg_videogame_id"),
    startggVideogameSlug: text("startgg_videogame_slug"),
    iconUrl: text("icon_url"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("games_slug_idx").on(t.slug)],
);

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------

export const venues = pgTable(
  "venues",
  {
    id: id(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    address: text("address"),
    city: text("city"),
    region: text("region"),
    state: text("state").notNull().default("UT"),
    postalCode: text("postal_code"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    websiteUrl: text("website_url"),
    phone: text("phone"),
    hours: text("hours"),
    equipmentNotes: text("equipment_notes"),
    byodRequired: boolean("byod_required").notNull().default(false),
    agePolicy: agePolicyEnum("age_policy").notNull().default("unknown"),
    accessibilityNotes: text("accessibility_notes"),
    typicalCostNotes: text("typical_cost_notes"),
    imageUrl: text("image_url"),
    status: listingStatusEnum("status").notNull().default("published"),
    sourceId: uuid("source_id"),
    lastConfirmedAt: timestamp("last_confirmed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("venues_slug_idx").on(t.slug),
    index("venues_city_idx").on(t.city),
    index("venues_status_idx").on(t.status),
  ],
);

// ---------------------------------------------------------------------------
// Communities
// ---------------------------------------------------------------------------

export const communities = pgTable(
  "communities",
  {
    id: id(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    welcomeText: text("welcome_text"),
    city: text("city"),
    region: text("region"),
    primaryUrl: text("primary_url"),
    discordUrl: text("discord_url"),
    facebookUrl: text("facebook_url"),
    websiteUrl: text("website_url"),
    codeOfConductUrl: text("code_of_conduct_url"),
    contactEmail: text("contact_email"),
    organizationId: uuid("organization_id"),
    status: listingStatusEnum("status").notNull().default("published"),
    sourceId: uuid("source_id"),
    lastConfirmedAt: timestamp("last_confirmed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("communities_slug_idx").on(t.slug),
    index("communities_city_idx").on(t.city),
  ],
);

export const communityGames = pgTable(
  "community_games",
  {
    communityId: uuid("community_id")
      .notNull()
      .references(() => communities.id, { onDelete: "cascade" }),
    gameId: uuid("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
  },
  (t) => [uniqueIndex("community_games_pk").on(t.communityId, t.gameId)],
);
