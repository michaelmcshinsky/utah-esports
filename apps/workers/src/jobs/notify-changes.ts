import { and, eq, gte } from "drizzle-orm";
import {
  changeRecords,
  eventFollows,
  eventGames,
  eventOccurrences,
  follows,
  notificationDeliveries,
  userPreferences,
  userProfiles,
  getDb,
} from "@utah-esports/db";
import { createTransport, renderChangeNotice } from "@utah-esports/email";
import { log } from "../lib/logger.js";

/**
 * Change notifications: when an event's material fields change (organizer
 * edit or approved import), notify users who follow the event, its
 * organization, or its games. Quiet hours queue the email for the next run;
 * per-user delivery rows make the job idempotent.
 */
export async function runChangeNotifications(now = new Date()): Promise<{ sent: number; queued: number }> {
  const db = getDb();
  const windowStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const hour = now.getHours();

  const changes = await db
    .select()
    .from(changeRecords)
    .where(and(eq(changeRecords.entityKind, "event"), gte(changeRecords.createdAt, windowStart)))
    .limit(500);

  // Group by event so followers receive one digest-style notice per event.
  const byEvent = new Map<string, typeof changes>();
  for (const change of changes) {
    const list = byEvent.get(change.entityId) ?? [];
    list.push(change);
    byEvent.set(change.entityId, list);
  }

  const transport = createTransport();
  let sent = 0;
  let queued = 0;

  for (const [eventId, eventChanges] of byEvent) {
    const [event] = await db
      .select()
      .from(eventOccurrences)
      .where(eq(eventOccurrences.id, eventId))
      .limit(1);
    if (!event) continue;

    const followerIds = new Set<string>();
    const eventFollowers = await db
      .select()
      .from(eventFollows)
      .where(eq(eventFollows.eventId, eventId));
    for (const f of eventFollowers) followerIds.add(f.userId);
    if (event.organizationId) {
      const orgFollowers = await db
        .select()
        .from(follows)
        .where(and(eq(follows.kind, "organization"), eq(follows.targetId, event.organizationId)));
      for (const f of orgFollowers) followerIds.add(f.userId);
    }
    const gameFollowers = await db
      .select({ follow: follows })
      .from(follows)
      .innerJoin(eventGames, eq(eventGames.gameId, follows.targetId))
      .where(and(eq(follows.kind, "game"), eq(eventGames.eventId, eventId)));
    for (const { follow } of gameFollowers) followerIds.add(follow.userId);
    if (followerIds.size === 0) continue;

    const fields = [...new Set(eventChanges.map((c) => c.field))].join(", ");
    const summary = `Updated: ${fields}`;

    for (const userId of followerIds) {
      const kind = `change:${eventId}:${userId}`;
      const [already] = await db
        .select({ id: notificationDeliveries.id })
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.kind, kind))
        .limit(1);
      if (already) continue;

      const [pref] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .limit(1);
      if (pref && !pref.changeNotificationsEnabled) continue;
      const inQuiet = pref
        ? pref.quietHoursStart > pref.quietHoursEnd
          ? hour >= pref.quietHoursStart || hour < pref.quietHoursEnd
          : hour >= pref.quietHoursStart && hour < pref.quietHoursEnd
        : hour >= 22 || hour < 8;
      if (inQuiet) {
        queued++; // retried on a later run outside quiet hours
        continue;
      }

      const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.id, userId))
        .limit(1);
      if (!profile) continue;

      const message = renderChangeNotice({
        eventTitle: event.title,
        eventUrl: `https://utahesports.net/events/${event.slug}`,
        changeSummary: summary,
      });
      try {
        await transport.send({ ...message, to: profile.email });
        await db.insert(notificationDeliveries).values({
          userId,
          kind,
          channel: "email",
          subject: message.subject,
          payload: { eventId, fields },
          status: "sent",
          sentAt: new Date(),
        });
        sent++;
      } catch (err) {
        log("error", "notify-changes", "send failed", {
          eventId,
          userId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  log("info", "notify-changes", "complete", { sent, queued });
  return { sent, queued };
}
