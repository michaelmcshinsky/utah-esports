import { and, eq, gt, lt, or, sql } from "drizzle-orm";
import { eventOccurrences, organizations, getDb } from "@utah-esports/db";
import { createTransport, renderFreshnessRequest } from "@utah-esports/email";
import { log } from "../lib/logger.js";

/**
 * Freshness: upcoming listings that haven't been confirmed recently are
 * labeled needs_verification (reducing trust/visibility) and owners are
 * asked to re-confirm. Import-sourced rows get the same label without email.
 */
export async function runFreshnessCheck(): Promise<{ flagged: number; emailed: number }> {
  const db = getDb();
  const now = new Date();
  const staleBefore = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
  const upcomingLimit = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const stale = await db
    .select({
      event: eventOccurrences,
      org: organizations,
    })
    .from(eventOccurrences)
    .leftJoin(organizations, eq(eventOccurrences.organizationId, organizations.id))
    .where(
      and(
        eq(eventOccurrences.status, "published"),
        gt(eventOccurrences.startsAt, now),
        lt(eventOccurrences.startsAt, upcomingLimit),
        or(
          sql`${eventOccurrences.lastConfirmedAt} is null`,
          lt(eventOccurrences.lastConfirmedAt, staleBefore),
        ),
      ),
    )
    .limit(200);

  let flagged = 0;
  let emailed = 0;
  const transport = createTransport();

  for (const row of stale) {
    const event = row.event;
    await db
      .update(eventOccurrences)
      .set({ status: "needs_verification", updatedAt: now })
      .where(eq(eventOccurrences.id, event.id));
    flagged++;

    if (row.org?.contactEmail) {
      try {
        const message = renderFreshnessRequest({
          orgName: row.org.name,
          eventTitle: event.title,
          eventUrl: `https://utahesports.net/events/${event.slug}`,
          confirmUrl: `https://utahesports.net/dashboard/org/${row.org.slug}/events/${event.id}`,
        });
        await transport.send({ ...message, to: row.org.contactEmail });
        emailed++;
      } catch (err) {
        log("error", "freshness", "email failed", {
          eventId: event.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  log("info", "freshness", "check complete", { flagged, emailed });
  return { flagged, emailed };
}

/** Organizer re-confirmation: flip back to published. */
export async function confirmEvent(eventId: string, userId: string) {
  const db = getDb();
  const [updated] = await db
    .update(eventOccurrences)
    .set({
      status: "published",
      lastConfirmedAt: new Date(),
      confirmedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(eventOccurrences.id, eventId))
    .returning();
  return updated ?? null;
}
