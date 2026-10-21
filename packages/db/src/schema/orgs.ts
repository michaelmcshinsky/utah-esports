import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  id,
  orgKindEnum,
  orgRoleEnum,
  schoolPathwayEnum,
  createdAt,
  updatedAt,
} from "./core.js";

/**
 * Organizations are the ownership and permission boundary.
 * One shared public discovery layer; org-scoped editing only — not tenants.
 */

export const organizations = pgTable(
  "organizations",
  {
    id: id(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    kind: orgKindEnum("kind").notNull().default("community"),
    description: text("description"),
    websiteUrl: text("website_url"),
    contactEmail: text("contact_email").notNull(),
    city: text("city"),
    region: text("region"),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    status: text("status").notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("organizations_slug_idx").on(t.slug)],
);

export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    role: orgRoleEnum("role").notNull().default("viewer"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("organization_memberships_uniq").on(t.organizationId, t.userId),
    index("organization_memberships_user_idx").on(t.userId),
  ],
);

export const organizationClaims = pgTable(
  "organization_claims",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    proofUrl: text("proof_url").notNull(),
    message: text("message"),
    contactEmail: text("contact_email").notNull(),
    status: text("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNotes: text("review_notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("organization_claims_status_idx").on(t.status)],
);

/** Per-org Discord announcement destination (bot posts only where configured). */
export const orgDiscordConfigs = pgTable(
  "org_discord_configs",
  {
    id: id(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    guildId: text("guild_id").notNull(),
    guildName: text("guild_name"),
    announceChannelId: text("announce_channel_id"),
    announceChannelName: text("announce_channel_name"),
    eventsChannelId: text("events_channel_id"),
    enabled: boolean("enabled").notNull().default(false),
    authorizedBy: uuid("authorized_by"),
    botJoinedAt: timestamp("bot_joined_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("org_discord_configs_guild_uniq").on(t.organizationId, t.guildId),
  ],
);

// ---------------------------------------------------------------------------
// Teams & school programs
// ---------------------------------------------------------------------------

export const teams = pgTable(
  "teams",
  {
    id: id(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    pathway: schoolPathwayEnum("pathway"),
    gameId: uuid("game_id"),
    description: text("description"),
    tryoutInfo: text("tryout_info"),
    contactEmail: text("contact_email"),
    websiteUrl: text("website_url"),
    institution: text("institution"),
    city: text("city"),
    status: text("status").notNull().default("active"),
    sourceId: uuid("source_id"),
    lastConfirmedAt: timestamp("last_confirmed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("teams_slug_idx").on(t.slug),
    index("teams_pathway_idx").on(t.pathway),
  ],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: id(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    role: text("role").notNull().default("player"),
    gameRole: text("game_role"),
    discordUserId: text("discord_user_id"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().default(sql`now()`),
    leftAt: timestamp("left_at", { withTimezone: true }),
    sortWeight: text("sort_weight"),
  },
  (t) => [index("team_members_team_idx").on(t.teamId)],
);

export const userDiscordLinks = pgTable(
  "user_discord_links",
  {
    id: id(),
    userId: uuid("user_id").notNull(),
    discordUserId: text("discord_user_id").notNull(),
    discordUsername: text("discord_username"),
    linkedAt: timestamp("linked_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    uniqueIndex("user_discord_links_user_uniq").on(t.userId),
    uniqueIndex("user_discord_links_discord_uniq").on(t.discordUserId),
  ],
);
