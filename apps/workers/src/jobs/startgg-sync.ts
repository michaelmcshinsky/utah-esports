import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import {
  eventOccurrences,
  eventGames,
  games,
  duplicateCandidates,
  sourceRecords,
  sources,
  syncRuns,
  changeRecords,
  getDb,
} from "@utah-esports/db";
import { StartggClient, collectUtahEvents, normalizeStartggEvent, matchGameSlug, fetchVideogameBySlug, UTAH_CENTER } from "@utah-esports/startgg";
import { findLikelyDuplicate } from "../lib/dedupe.js";
import { log } from "../lib/logger.js";

export type StartggSyncResult = {
  imported: number;
  updated: number;
  unchanged: number;
  duplicates: number;
  errors: string[];
};

const SOURCE_KEY = "startgg";

export async function runStartggSync(options: { token?: string } = {}): Promise<StartggSyncResult> {
  const token = options.token ?? process.env.STARTGG_TOKEN;
  const result: StartggSyncResult = {
    imported: 0,
    updated: 0,
    unchanged: 0,
    duplicates: 0,
    errors: [],
  };
  if (!token) {
    log("warn", "startgg-sync", "STARTGG_TOKEN missing — skipping sync");
    return result;
  }

  const db = getDb();
  const client = new StartggClient({ token });
  const [source] = await db
    .insert(sources)
    .values({ key: SOURCE_KEY, kind: "startgg", name: "start.gg", homepage: "https://start.gg" })
    .onConflictDoUpdate({
      target: sources.key,
      set: { kind: "startgg", name: "start.gg" },
    })
    .returning();
  if (!source) throw new Error("Failed to ensure startgg source row");

  const [run] = await db
    .insert(syncRuns)
    .values({ sourceId: source.id, status: "running" })
    .returning();

  const knownGames = await db.select().from(games);
  const horizonEnd = Math.floor(Date.now() / 1000) + 60 * 24 * 60 * 60;

  try {
    // Resolve start.gg videogame IDs for known slugs (best effort, cached in DB).
    const unresolved = knownGames.filter(
      (g) => g.startggVideogameSlug && g.startggVideogameId == null,
    );
    for (const game of unresolved.slice(0, 15)) {
      try {
        const vg = await fetchVideogameBySlug(client, game.startggVideogameSlug!);
        if (vg) {
          await db
            .update(games)
            .set({ startggVideogameId: Number(vg.id) })
            .where(eq(games.id, game.id));
          game.startggVideogameId = Number(vg.id);
        }
      } catch (err) {
        log("warn", "startgg-sync", "videogame resolution failed", {
          slug: game.startggVideogameSlug,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const events = await collectUtahEvents(client, {
      lat: UTAH_CENTER.lat,
      lng: UTAH_CENTER.lng,
      radius: "150mi",
      afterDate: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
      beforeDate: horizonEnd,
      maxPages: 10,
      perPage: 25,
    });

    for (const raw of events) {
      try {
        const normalized = normalizeStartggEvent(raw);
        if (normalized.city && !/utah|UT$/i.test(normalized.state ?? "UT")) {
          // Keep Utah-ish results; start.gg radius already biases local.
        }

        const [record] = await db
          .insert(sourceRecords)
          .values({
            sourceId: source.id,
            externalId: normalized.externalId,
            entityKind: "event",
            url: normalized.sourceUrl,
            payload: normalized,
          })
          .onConflictDoUpdate({
            target: [sourceRecords.sourceId, sourceRecords.externalId],
            set: { lastSeenAt: new Date(), payload: normalized, url: normalized.sourceUrl },
          })
          .returning();

        const existing = await db
          .select()
          .from(eventOccurrences)
          .where(eq(eventOccurrences.sourceRecordId, record?.id ?? ""))
          .limit(1);

        const slug = `sg-${normalized.slug}`;
        const gameSlugs: string[] = [];
        if (raw.videogame) {
          const match = matchGameSlug(raw.videogame, knownGames);
          if (match) gameSlugs.push(match);
        }

        if (existing[0]) {
          const event = existing[0];
          const patch: Partial<typeof eventOccurrences.$inferInsert> = {
            lastObservedAt: new Date(),
            registrationDeadline: normalized.registrationDeadline,
          };
          if (event.title !== normalized.title) {
            await db.insert(changeRecords).values({
              entityKind: "event",
              entityId: event.id,
              field: "title",
              oldValue: event.title,
              newValue: normalized.title,
              actor: "system:startgg-sync",
            });
            patch.title = normalized.title;
            result.updated++;
          } else {
            result.unchanged++;
          }
          await db.update(eventOccurrences).set(patch).where(eq(eventOccurrences.id, event.id));
          continue;
        }

        // Respect prior moderation decisions for this source record.
        const priorDecision = record?.id
          ? await db
              .select()
              .from(duplicateCandidates)
              .where(eq(duplicateCandidates.candidateSourceRecordId, record.id))
              .limit(1)
          : [];
        const decision = priorDecision[0]?.status;
        if (decision === "merged") {
          result.unchanged++;
          continue;
        }

        // Duplicate check against upcoming published events (same window).
        const upcoming = await db
          .select({
            id: eventOccurrences.id,
            title: eventOccurrences.title,
            startsAt: eventOccurrences.startsAt,
            city: eventOccurrences.city,
          })
          .from(eventOccurrences)
          .where(inArray(eventOccurrences.status, ["published", "needs_verification"] as const))
          .limit(500);
        const dup =
          decision === "rejected"
            ? null
            : findLikelyDuplicate(
                { title: normalized.title, startsAt: normalized.startsAt, city: normalized.city },
                upcoming,
              );
        if (dup) {
          if (!priorDecision[0]) {
            await db
              .insert(duplicateCandidates)
              .values({
                entityKind: "event",
                keptEntityId: dup.match.id,
                candidateSourceRecordId: record?.id,
                score: dup.score,
                status: "pending",
              })
              .returning();
          }
          result.duplicates++;
          continue;
        }

        const [created] = await db
          .insert(eventOccurrences)
          .values({
            id: randomUUID(),
            slug,
            title: normalized.title,
            description: null,
            eventType: "tournament",
            format: normalized.format,
            startsAt: normalized.startsAt,
            endsAt: normalized.endsAt,
            city: normalized.city,
            region: null,
            lat: normalized.lat,
            lng: normalized.lng,
            onlineUrl: normalized.onlineUrl,
            registrationUrl: normalized.registrationUrl,
            registrationState: "open",
            registrationDeadline: normalized.registrationDeadline,
            contactName: normalized.hostName,
            contactEmail: null,
            status: "published",
            sourceId: source.id,
            sourceRecordId: record?.id,
            lastObservedAt: new Date(),
            lastConfirmedAt: new Date(),
            publishedAt: new Date(),
          })
          .returning();
        if (created && record) {
          await db
            .update(sourceRecords)
            .set({ entityId: created.id })
            .where(eq(sourceRecords.id, record.id));
          const gameMatch = raw.videogame
            ? knownGames.find((g) => g.slug === gameSlugs[0])
            : undefined;
          if (gameMatch) {
            await db
              .insert(eventGames)
              .values({ eventId: created.id, gameId: gameMatch.id })
              .onConflictDoNothing();
          }
          result.imported++;
        }
      } catch (err) {
        result.errors.push(
          `event ${raw.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (run) {
      await db
        .update(syncRuns)
        .set({
          status: result.errors.length ? "partial" : "success",
          finishedAt: new Date(),
          imported: result.imported,
          updated: result.updated,
          unchanged: result.unchanged,
          duplicates: result.duplicates,
          errors: result.errors.length ? result.errors : null,
        })
        .where(eq(syncRuns.id, run.id));
    }
    log("info", "startgg-sync", "sync complete", { ...result, errors: undefined });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.errors.push(message);
    if (run) {
      await db
        .update(syncRuns)
        .set({ status: "failed", finishedAt: new Date(), errors: [message] })
        .where(eq(syncRuns.id, run.id));
    }
    log("error", "startgg-sync", "sync failed", { error: message });
  }
  return result;
}
