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
import { id, sourceKindEnum, createdAt, updatedAt } from "./core.js";

/**
 * Ingestion keeps provenance first-class: every imported object remembers
 * its source, external id, observed payload, and sync history. Imports
 * update approved fields only; organizer overrides win over older imports.
 */

export const sources = pgTable(
  "sources",
  {
    id: id(),
    key: text("key").notNull(),
    kind: sourceKindEnum("kind").notNull(),
    name: text("name").notNull(),
    homepage: text("homepage"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("sources_key_idx").on(t.key)],
);

export const sourceRecords = pgTable(
  "source_records",
  {
    id: id(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    entityKind: text("entity_kind").notNull(),
    entityId: uuid("entity_id"),
    url: text("url"),
    payload: jsonb("payload"),
    contentHash: text("content_hash"),
    status: text("status").notNull().default("active"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    missingSince: timestamp("missing_since", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("source_records_uniq").on(t.sourceId, t.externalId),
    index("source_records_entity_idx").on(t.entityKind, t.entityId),
  ],
);

export const syncRuns = pgTable(
  "sync_runs",
  {
    id: id(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    status: text("status").notNull().default("running"),
    imported: integer("imported").notNull().default(0),
    updated: integer("updated").notNull().default(0),
    unchanged: integer("unchanged").notNull().default(0),
    duplicates: integer("duplicates").notNull().default(0),
    missing: integer("missing").notNull().default(0),
    errors: jsonb("errors"),
    notes: text("notes"),
  },
  (t) => [index("sync_runs_source_idx").on(t.sourceId, t.startedAt)],
);

export const changeRecords = pgTable(
  "change_records",
  {
    id: id(),
    entityKind: text("entity_kind").notNull(),
    entityId: uuid("entity_id").notNull(),
    field: text("field").notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    actor: text("actor").notNull(),
    reason: text("reason"),
    createdAt: createdAt(),
  },
  (t) => [index("change_records_entity_idx").on(t.entityKind, t.entityId)],
);

export const duplicateCandidates = pgTable(
  "duplicate_candidates",
  {
    id: id(),
    entityKind: text("entity_kind").notNull(),
    keptEntityId: uuid("kept_entity_id").notNull(),
    candidateEntityId: uuid("candidate_entity_id"),
    candidateSourceRecordId: uuid("candidate_source_record_id"),
    score: integer("score").notNull(),
    status: text("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("duplicate_candidates_status_idx").on(t.status)],
);

/**
 * Public catalog of known Utah gaming sites (event platforms, venues,
 * conventions, scholastic bodies, organizers, community hubs) with scrape
 * instructions. Seeded from packages/scrapers catalog data.
 */
export const catalogSources = pgTable(
  "catalog_sources",
  {
    slug: text("slug").primaryKey(),
    name: text("name").notNull(),
    kind: text("kind").notNull(),
    url: text("url").notNull(),
    city: text("city"),
    region: text("region"),
    games: text("games").array().notNull().default(sql`'{}'::text[]`),
    status: text("status").notNull().default("unknown"),
    scrapeAdapter: text("scrape_adapter").notNull().default("none"),
    scrapeUrls: text("scrape_urls").array().notNull().default(sql`'{}'::text[]`),
    scrapeNotes: text("scrape_notes"),
    directoryTypes: text("directory_types").array().notNull().default(sql`'{}'::text[]`),
    directoryImported: boolean("directory_imported").notNull().default(false),
    notes: text("notes"),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("catalog_sources_kind_idx").on(t.kind), index("catalog_sources_status_idx").on(t.status)],
);
