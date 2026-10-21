import { and, eq, gt, lt } from "drizzle-orm";
import { eventOccurrences, notificationDeliveries, userPreferences, getDb } from "@utah-esports/db";
import { createTransport, renderDeadlineReminder } from "@utah-esports/email";
import { log } from "../lib/logger.js";

/**
 * Registration deadline reminders for opted-in users.
 * Respects quiet hours (no sends in the user's configured window) and
 * deduplicates via notification_deliveries.
 */
export async function runDeadlineReminders(now = new Date()): Promise<{ sent: number }> {
  const db = getDb();
  const windowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const hour = now.getHours();

  const events = await db
    .select()
    .from(eventOccurrences)
    .where(
      and(
        eq(eventOccurrences.status, "published"),
        eq(eventOccurrences.registrationState, "open"),
        gt(eventOccurrences.registrationDeadline, now),
        lt(eventOccurrences.registrationDeadline, windowEnd),
      ),
    )
    .limit(100);

  if (events.length === 0) return { sent: 0 };

  const prefs = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.reminderEnabled, true));

  const transport = createTransport();
  let sent = 0;

  for (const event of events) {
    if (!event.registrationDeadline) continue;
    for (const pref of prefs) {
      // Quiet hours: skip sends inside the user's window (handles wrap).
      const inQuiet =
        pref.quietHoursStart > pref.quietHoursEnd
          ? hour >= pref.quietHoursStart || hour < pref.quietHoursEnd
          : hour >= pref.quietHoursStart && hour < pref.quietHoursEnd;
      if (inQuiet) continue;

      const already = await db
        .select({ id: notificationDeliveries.id })
        .from(notificationDeliveries)
        .where(
          and(
            eq(notificationDeliveries.userId, pref.userId),
            eq(notificationDeliveries.kind, `deadline:${event.id}`),
          ),
        )
        .limit(1);
      if (already[0]) continue;

      // Only send when the user follows a matching game or has no filter.
      // (Conservative v1: send to all reminder-enabled users within 48h.)
      try {
        const message = renderDeadlineReminder({
          eventTitle: event.title,
          eventUrl: `https://utahesports.net/events/${event.slug}`,
          deadlineLabel: event.registrationDeadline.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
        });
        await db.insert(notificationDeliveries).values({
          userId: pref.userId,
          kind: `deadline:${event.id}`,
          channel: "email",
          subject: message.subject,
          payload: { eventId: event.id },
          status: "sent",
          sentAt: new Date(),
        });
        // Email address lives in user_profiles; transport needs it.
        const { userProfiles } = await import("@utah-esports/db");
        const { eq: eqOp } = await import("drizzle-orm");
        const [profile] = await db
          .select()
          .from(userProfiles)
          .where(eqOp(userProfiles.id, pref.userId))
          .limit(1);
        if (profile) {
          await transport.send({ ...message, to: profile.email });
          sent++;
        }
      } catch (err) {
        log("error", "deadline-reminders", "send failed", {
          eventId: event.id,
          userId: pref.userId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }
  log("info", "deadline-reminders", "complete", { sent });
  return { sent };
}
