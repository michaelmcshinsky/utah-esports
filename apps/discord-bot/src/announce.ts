import type { Client, TextChannel } from "discord.js";
import { and, eq, inArray, gt } from "drizzle-orm";
import {
  eventGames,
  eventOccurrences,
  games,
  notificationDeliveries,
  orgDiscordConfigs,
  getDb,
} from "@utah-esports/db";
import { log } from "./logger.js";

/**
 * Announcement loop: newly published/updated events post into channels the
 * org explicitly authorized. Nothing is scraped; nothing posts to DMs.
 * Delivery is tracked in notification_deliveries so restarts don't double-post.
 */
export function startAnnouncementLoop(client: Client) {
  const tick = async () => {
    try {
      await announcePending(client);
    } catch (err) {
      log("error", "announce", "tick failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };
  void tick();
  setInterval(tick, 5 * 60 * 1000);
}

export async function announcePending(client: Client): Promise<number> {
  const db = getDb();
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const events = await db
    .select()
    .from(eventOccurrences)
    .where(
      and(
        inArray(eventOccurrences.status, ["published"]),
        gt(eventOccurrences.publishedAt, windowStart),
      ),
    )
    .limit(50);

  let posted = 0;
  for (const event of events) {
    if (!event.organizationId) continue;
    const kind = `discord-announce:${event.id}`;
    const [already] = await db
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.kind, kind))
      .limit(1);
    if (already) continue;

    const [config] = await db
      .select()
      .from(orgDiscordConfigs)
      .where(
        and(
          eq(orgDiscordConfigs.organizationId, event.organizationId),
          eq(orgDiscordConfigs.enabled, true),
        ),
      )
      .limit(1);
    if (!config?.announceChannelId) continue;

    const channel = await client.channels.fetch(config.announceChannelId).catch(() => null);
    if (!channel || !isTextChannel(channel)) continue;

    const gameRows = await db
      .select({ game: games })
      .from(eventGames)
      .innerJoin(games, eq(eventGames.gameId, games.id))
      .where(eq(eventGames.eventId, event.id));
    const whenLabel = event.startsAt.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    await channel.send({
      content: `📣 **${event.title}**\n${whenLabel}${event.city ? ` · ${event.city}` : event.format === "online" ? " · Online" : ""}\n${gameNames(gameRows)}\nhttps://utahesports.net/events/${event.slug}`,
    });

    await db.insert(notificationDeliveries).values({
      kind,
      channel: "discord",
      subject: `Announce ${event.title}`,
      payload: { eventId: event.id, channelId: config.announceChannelId },
      status: "sent",
      sentAt: new Date(),
    });
    posted++;
  }
  if (posted > 0) {
    log("info", "announce", "posted announcements", { posted });
  }
  return posted;
}

function gameNames(rows: Array<{ game: { name: string } }>): string {
  return rows.length ? rows.map((r) => r.game.name).join(", ") : "";
}

function isTextChannel(channel: unknown): channel is TextChannel {
  return (
    typeof channel === "object" &&
    channel !== null &&
    "isTextBased" in channel &&
    (channel as { isTextBased: () => boolean }).isTextBased()
  );
}
