import { and, eq, gt } from "drizzle-orm";
import { eventOccurrences, eventSeries, getDb } from "@utah-esports/db";
import { slugify } from "@utah-esports/core";
import { log } from "../lib/logger.js";

/**
 * Materialize dated occurrences from recurring series.
 * Generation is capped (max_occurrences) and never overwrites existing
 * occurrences — organizers reconfirm by extending the series.
 */
export async function runRecurringGeneration(now = new Date()): Promise<{ created: number }> {
  const db = getDb();
  const horizon = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const series = await db
    .select()
    .from(eventSeries)
    .where(
      and(
        eq(eventSeries.status, "published"),
        gt(eventSeries.recurrenceHint, ""),
      ),
    )
    .limit(50);

  let created = 0;
  for (const s of series) {
    if (s.seriesEndsOn && new Date(s.seriesEndsOn) < now) continue;
    const existing = await db
      .select({ id: eventOccurrences.id, startsAt: eventOccurrences.startsAt })
      .from(eventOccurrences)
      .where(eq(eventOccurrences.seriesId, s.id))
      .orderBy(eventOccurrences.startsAt);
    if (existing.length >= (s.maxOccurrences ?? 52)) continue;

    // Weekly cadence heuristic: next occurrence is 7 days after the last.
    const last = existing[existing.length - 1];
    const nextStart = last ? new Date(last.startsAt.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
    if (!nextStart || nextStart > horizon) continue;
    if (s.seriesEndsOn && nextStart > new Date(`${s.seriesEndsOn}T23:59:59`)) continue;

    const daySlug = nextStart.toISOString().slice(0, 10);
    const slug = `${daySlug}-${slugify(s.title)}`;
    const [alreadyExists] = await db
      .select({ id: eventOccurrences.id })
      .from(eventOccurrences)
      .where(eq(eventOccurrences.slug, slug))
      .limit(1);
    if (alreadyExists) continue;

    await db
      .insert(eventOccurrences)
      .values({
        slug,
        seriesId: s.id,
        organizationId: s.organizationId,
        venueId: s.venueId,
        title: s.title,
        description: s.description,
        eventType: s.eventType,
        format: s.format,
        startsAt: nextStart,
        status: s.status === "published" ? "draft" : s.status,
        createdById: s.createdById,
        lastConfirmedAt: now,
      })
      .returning();
    created++;
  }
  log("info", "recurring", "generation complete", { created });
  return { created };
}
