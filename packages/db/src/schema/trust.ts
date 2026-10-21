import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { id, createdAt } from "./core.js";

/**
 * Trust & safety: submissions, reports, moderation actions, audit, redirects.
 * Youth-related contact rules are enforced in app layer: no public home
 * addresses or personal contacts for minors; official org contacts only.
 */

export const eventSubmissions = pgTable(
  "event_submissions",
  {
    id: id(),
    payload: jsonb("payload").notNull(),
    status: text("status").notNull().default("pending"),
    submittedBy: uuid("submitted_by"),
    contactEmail: text("contact_email").notNull(),
    sourceUrl: text("source_url"),
    reviewedBy: uuid("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNotes: text("review_notes"),
    eventId: uuid("event_id"),
    createdAt: createdAt(),
  },
  (t) => [index("event_submissions_status_idx").on(t.status)],
);

export const reports = pgTable(
  "reports",
  {
    id: id(),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    reason: text("reason").notNull(),
    details: text("details"),
    contactEmail: text("contact_email"),
    status: text("status").notNull().default("open"),
    reviewedBy: uuid("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("reports_status_idx").on(t.status), index("reports_target_idx").on(t.targetType, t.targetId)],
);

export const moderationActions = pgTable(
  "moderation_actions",
  {
    id: id(),
    actorId: uuid("actor_id"),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: uuid("target_id"),
    notes: text("notes"),
    createdAt: createdAt(),
  },
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    actorId: uuid("actor_id"),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: uuid("target_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_logs_target_idx").on(t.targetType, t.targetId)],
);

export const redirects = pgTable(
  "redirects",
  {
    id: id(),
    fromPath: text("from_path").notNull(),
    toPath: text("to_path").notNull(),
    statusCode: integer("status_code").notNull().default(301),
    createdAt: createdAt(),
  },
  (t) => [index("redirects_from_idx").on(t.fromPath)],
);

export const linkChecks = pgTable(
  "link_checks",
  {
    id: id(),
    url: text("url").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    status: text("status").notNull().default("unknown"),
    httpStatus: integer("http_status"),
    checkedAt: timestamp("checked_at", { withTimezone: true }),
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    notes: text("notes"),
  },
  (t) => [index("link_checks_url_idx").on(t.url)],
);

export { notificationChannelEnum } from "./core.js";
