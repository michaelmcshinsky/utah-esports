import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  createdAt,
  followKindEnum,
  id,
  notificationChannelEnum,
  updatedAt,
} from "./core.js";

/**
 * Member data. `user_profiles.id` equals the Supabase auth user id.
 * Browsing needs no account; follows/saved searches are the first reasons
 * to create one.
 */

export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    isModerator: boolean("is_moderator").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("user_profiles_email_idx").on(t.email)],
);

export const userPreferences = pgTable(
  "user_preferences",
  {
    userId: uuid("user_id").primaryKey(),
    displayName: text("display_name"),
    city: text("city"),
    radiusKm: integer("radius_km").notNull().default(40),
    gameSlugs: text("game_slugs").array().notNull().default(sql`'{}'::text[]`),
    eventTypes: text("event_types").array().notNull().default(sql`'{}'::text[]`),
    digestDayOfWeek: integer("digest_day_of_week").notNull().default(1),
    digestEnabled: boolean("digest_enabled").notNull().default(true),
    reminderEnabled: boolean("reminder_enabled").notNull().default(true),
    changeNotificationsEnabled: boolean("change_notifications_enabled")
      .notNull()
      .default(true),
    quietHoursStart: integer("quiet_hours_start").notNull().default(22),
    quietHoursEnd: integer("quiet_hours_end").notNull().default(8),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
);

export const follows = pgTable(
  "follows",
  {
    id: id(),
    userId: uuid("user_id").notNull(),
    kind: followKindEnum("kind").notNull(),
    targetId: uuid("target_id").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("follows_uniq").on(t.userId, t.kind, t.targetId),
    index("follows_target_idx").on(t.kind, t.targetId),
  ],
);

export const savedSearches = pgTable(
  "saved_searches",
  {
    id: id(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    /** Serialized core EventSearchFilter query string. */
    query: text("query").notNull(),
    notify: boolean("notify").notNull().default(true),
    lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("saved_searches_user_idx").on(t.userId)],
);

export const savedEvents = pgTable(
  "saved_events",
  {
    id: id(),
    userId: uuid("user_id").notNull(),
    eventId: uuid("event_id").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("saved_events_uniq").on(t.userId, t.eventId)],
);

export const eventFollows = pgTable(
  "event_follows",
  {
    id: id(),
    userId: uuid("user_id").notNull(),
    eventId: uuid("event_id").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("event_follows_uniq").on(t.userId, t.eventId)],
);

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: id(),
    userId: uuid("user_id"),
    kind: text("kind").notNull(),
    channel: notificationChannelEnum("channel").notNull().default("email"),
    subject: text("subject"),
    payload: jsonb("payload"),
    status: text("status").notNull().default("pending"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    error: text("error"),
    createdAt: createdAt(),
  },
  (t) => [index("notification_deliveries_user_idx").on(t.userId, t.kind)],
);

/** One-time codes for linking a Discord account to a site account. */
export const discordLinkCodes = pgTable(
  "discord_link_codes",
  {
    id: id(),
    code: text("code").notNull(),
    userId: uuid("user_id"),
    discordUserId: text("discord_user_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("discord_link_codes_code_idx").on(t.code)],
);

export { eventTypeEnum, followKindEnum, notificationChannelEnum } from "./core.js";
