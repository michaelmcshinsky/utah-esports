import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { id, createdAt } from "./core.js";

/**
 * Outbound clicks are participation *proxies* — not attendance.
 * Kept deliberately simple; no cross-site tracking.
 */

export const outboundClicks = pgTable(
  "outbound_clicks",
  {
    id: id(),
    kind: text("kind").notNull(),
    eventId: uuid("event_id"),
    communityId: uuid("community_id"),
    organizationId: uuid("organization_id"),
    venueId: uuid("venue_id"),
    targetUrl: text("target_url"),
    referrer: text("referrer"),
    createdAt: createdAt(),
  },
  (t) => [index("outbound_clicks_event_idx").on(t.eventId, t.createdAt)],
);

export const digestSends = pgTable(
  "digest_sends",
  {
    id: id(),
    userId: uuid("user_id").notNull(),
    weekOf: timestamp("week_of", { withTimezone: true }).notNull(),
    eventCount: integer("event_count").notNull().default(0),
    status: text("status").notNull().default("pending"),
    createdAt: createdAt(),
  },
  (t) => [index("digest_sends_user_week_idx").on(t.userId, t.weekOf)],
);
