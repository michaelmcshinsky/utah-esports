import { createHash } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import {
  duplicateCandidates,
  eventGames,
  eventOccurrences,
  games,
  getDb,
  sourceRecords,
  sources,
  venues,
} from "@utah-esports/db";
import { findLikelyDuplicate, slugify } from "@utah-esports/core";
import { scrapeUrlForDraft, type EventDraft, type ScrapeDraftResult } from "@utah-esports/scrapers";
import { log } from "../lib/logger.js";

/**
 * URL → draft event pipeline. Scrapes via the adapter registry (start.gg →
 * legacy Jekyll → generic JSON-LD/h-event/meta), dedupes against existing
 * events, and records source provenance. Used by the submit-form preview
 * API and the CLI importer.
 *
 * Provenance rule: EVERY imported draft gets a source_records row — the
 * scrape URL itself is the external id when the page carries no identifier.
 * Duplicate matches land in the moderation queue instead of vanishing.
 */

export type UrlProvenance = { sourceId: string; recordId: string };

/** Check a scraped draft against existing events; returns the likely match. */
export async function findDuplicateForDraft(draft: EventDraft): Promise<{
  id: string;
  slug: string;
  title: string;
  startsAt: Date;
  score: number;
} | null> {
  if (!draft.startsAt) return null;
  const db = getDb();
  const candidates = await db
    .select({
      id: eventOccurrences.id,
      slug: eventOccurrences.slug,
      title: eventOccurrences.title,
      startsAt: eventOccurrences.startsAt,
      city: eventOccurrences.city,
    })
    .from(eventOccurrences)
    .where(inArray(eventOccurrences.status, ["published", "needs_verification", "draft"]))
    .limit(500);
  const match = findLikelyDuplicate(
    { title: draft.title, startsAt: draft.startsAt, city: draft.city ?? null },
    candidates,
  );
  return match
    ? {
        id: match.match.id,
        slug: match.match.slug,
        title: match.match.title,
        startsAt: match.match.startsAt,
        score: match.score,
      }
    : null;
}

/**
 * Persist the source record for a scraped URL (provenance). Falls back to a
 * URL hash as the external id so even identifier-less pages stay traceable.
 */
export async function recordSourceForUrl(
  kind: "startgg" | "import" | "legacy_jekyll" | "organizer",
  url: string,
  externalId: string | undefined,
  payload: unknown,
): Promise<UrlProvenance | null> {
  const db = getDb();
  const external = externalId ?? `url:${createHash("sha1").update(url).digest("hex").slice(0, 24)}`;
  const [source] = await db
    .insert(sources)
    .values({ key: kind, kind, name: kind })
    .onConflictDoUpdate({ target: sources.key, set: { kind } })
    .returning();
  if (!source) return null;
  const [record] = await db
    .insert(sourceRecords)
    .values({
      sourceId: source.id,
      externalId: external,
      entityKind: "event",
      url,
      payload: payload as never,
    })
    .onConflictDoUpdate({
      target: [sourceRecords.sourceId, sourceRecords.externalId],
      set: { lastSeenAt: new Date(), url, payload: payload as never },
    })
    .returning();
  if (!record) return null;
  return { sourceId: source.id, recordId: record.id };
}

/** Resolve game names → ids, creating rows for unknown names. */
export async function resolveGameIds(names: string[]): Promise<string[]> {
  const db = getDb();
  const ids: string[] = [];
  for (const name of names) {
    const gameSlug = slugify(name);
    let [game] = await db.select().from(games).where(eq(games.slug, gameSlug)).limit(1);
    if (!game) {
      [game] = await db.insert(games).values({ slug: gameSlug, name }).returning();
    }
    if (game) ids.push(game.id);
  }
  return ids;
}

/** Create a draft event from a scraped draft (moderator/owner reviews before publish). */
export async function createDraftFromDraft(
  draft: EventDraft,
  provenance?: UrlProvenance,
): Promise<string | null> {
  const db = getDb();
  if (!draft.startsAt) return null;
  const slug = `${draft.startsAt.toISOString().slice(0, 10)}-${slugify(draft.title)}`;
  const [existing] = await db
    .select({ id: eventOccurrences.id })
    .from(eventOccurrences)
    .where(eq(eventOccurrences.slug, slug))
    .limit(1);
  if (existing) return existing.id;

  // Attach to an existing venue when the scraped name matches a known slug.
  let venueId: string | null = null;
  if (draft.venueName) {
    const [venue] = await db
      .select({ id: venues.id })
      .from(venues)
      .where(eq(venues.slug, slugify(draft.venueName)))
      .limit(1);
    venueId = venue?.id ?? null;
  }

  const sourceKind =
    draft.source.kind === "startgg"
      ? "startgg"
      : draft.source.kind === "legacy_jekyll"
        ? "legacy_jekyll"
        : "import";
  const provenanceLink =
    provenance ??
    (await recordSourceForUrl(sourceKind, draft.source.originUrl, draft.source.externalId, draft.raw ?? { title: draft.title }));

  const [event] = await db
    .insert(eventOccurrences)
    .values({
      slug,
      title: draft.title,
      description: draft.description ?? null,
      eventType: draft.eventType,
      format: draft.format,
      startsAt: draft.startsAt,
      endsAt: draft.endsAt ?? null,
      city: draft.city ?? null,
      venueId,
      onlineUrl: draft.format === "online" ? draft.url : null,
      registrationUrl: draft.url,
      registrationState: draft.registrationState ?? "unknown",
      priceCents: draft.priceCents ?? null,
      contactName: draft.contactName ?? null,
      contactEmail: draft.contactEmail ?? null,
      imageUrl: draft.imageUrl ?? null,
      status: "draft",
      sourceId: provenanceLink?.sourceId ?? null,
      sourceRecordId: provenanceLink?.recordId ?? null,
      lastObservedAt: new Date(),
      lastConfirmedAt: null,
    })
    .returning();
  if (!event) return null;

  const gameIds = await resolveGameIds(draft.gameNames);
  for (const gameId of gameIds) {
    await db.insert(eventGames).values({ eventId: event.id, gameId }).onConflictDoNothing();
  }
  if (provenanceLink) {
    await db
      .update(sourceRecords)
      .set({ entityId: event.id })
      .where(eq(sourceRecords.id, provenanceLink.recordId));
  }
  log("info", "url-import", "draft created", { slug, adapter: draft.source.adapter });
  return event.id;
}

/**
 * A duplicate hit goes to the moderation queue (pending) with full
 * provenance, so reviewers can merge/keep it instead of it disappearing.
 */
export async function queueDuplicateForDraft(
  draft: EventDraft,
  duplicate: { id: string; score: number },
): Promise<void> {
  const db = getDb();
  const sourceKind =
    draft.source.kind === "startgg"
      ? "startgg"
      : draft.source.kind === "legacy_jekyll"
        ? "legacy_jekyll"
        : "import";
  const provenance = await recordSourceForUrl(
    sourceKind,
    draft.source.originUrl,
    draft.source.externalId,
    draft.raw ?? { title: draft.title },
  );
  await db
    .insert(duplicateCandidates)
    .values({
      entityKind: "event",
      keptEntityId: duplicate.id,
      candidateSourceRecordId: provenance?.recordId ?? null,
      score: duplicate.score,
      status: "pending",
    })
    .returning();
  log("info", "url-import", "duplicate queued for review", {
    slug: draft.title,
    score: duplicate.score,
  });
}

/** Full CLI flow: scrape → dupe-check → create draft or queue duplicate. */
export async function importEventFromUrl(
  url: string,
  opts: { startggToken?: string } = {},
): Promise<
  | { status: "draft_created"; eventId: string; draft: EventDraft }
  | { status: "duplicate"; duplicate: NonNullable<Awaited<ReturnType<typeof findDuplicateForDraft>>>; draft: EventDraft }
  | ScrapeDraftResult
> {
  const scraped = await scrapeUrlForDraft(url, opts);
  if (scraped.status !== "ok") return scraped;
  const duplicate = await findDuplicateForDraft(scraped.draft);
  if (duplicate) {
    await queueDuplicateForDraft(scraped.draft, duplicate);
    return { status: "duplicate", duplicate, draft: scraped.draft };
  }
  const eventId = await createDraftFromDraft(scraped.draft);
  if (!eventId) return { status: "error", error: "Could not create the draft event" };
  return { status: "draft_created", eventId, draft: scraped.draft };
}
