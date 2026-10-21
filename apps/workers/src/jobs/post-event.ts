import { and, eq, gt, inArray } from "drizzle-orm";
import {
  eventOccurrences,
  notificationDeliveries,
  organizations,
  getDb,
} from "@utah-esports/db";
import { createTransport, renderPostEventFollowup } from "@utah-esports/email";
import { log } from "../lib/logger.js";

/**
 * Post-event lifecycle: completed events flip from published → completed
 * (keeping their archive page), and organizers get one request to confirm
 * details or share a recap. Never fabricates attendance or results.
 */
export async function runPostEventFollowup(now = new Date()): Promise<{
  completed: number;
  prompted: number;
}> {
  const db = getDb();
  const pastLimit = new Date(now.getTime() - 15 * 60 * 60 * 1000);

  const ended = await db
    .select({ event: eventOccurrences, org: organizations })
    .from(eventOccurrences)
    .leftJoin(organizations, eq(eventOccurrences.organizationId, organizations.id))
    .where(
      and(
        inArray(eventOccurrences.status, ["published", "needs_verification"] as const),
        eq(eventOccurrences.format, "in_person"),
        gt(eventOccurrences.startsAt, new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)),
      ),
    )
    .limit(300);

  const transport = createTransport();
  let completed = 0;
  let prompted = 0;

  for (const row of ended) {
    const event = row.event;
    const endsAt = event.endsAt ?? event.startsAt;
    if (endsAt > pastLimit) continue;

    if (event.status !== "completed") {
      await db
        .update(eventOccurrences)
        .set({ status: "completed", updatedAt: now })
        .where(eq(eventOccurrences.id, event.id));
      completed++;
    }

    if (!row.org?.contactEmail) continue;
    const kind = `postevent:${event.id}`;
    const [already] = await db
      .select({ id: notificationDeliveries.id })
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.kind, kind))
      .limit(1);
    if (already) continue;

    try {
      const message = renderPostEventFollowup({
        organizerName: row.org.name,
        eventTitle: event.title,
        eventUrl: `https://utahesports.net/events/${event.slug}`,
      });
      await transport.send({ ...message, to: row.org.contactEmail });
      await db.insert(notificationDeliveries).values({
        kind,
        channel: "email",
        subject: message.subject,
        payload: { eventId: event.id },
        status: "sent",
        sentAt: new Date(),
      });
      prompted++;
    } catch (err) {
      log("error", "post-event", "send failed", {
        eventId: event.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  log("info", "post-event", "complete", { completed, prompted });
  return { completed, prompted };
}
