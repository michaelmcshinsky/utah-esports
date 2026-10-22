import "./env.js";
import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
} from "discord.js";
import { handleInteraction } from "./commands.js";
import { startAnnouncementLoop } from "./announce.js";
import { startRosterRoleSync } from "./roster-sync.js";

/**
 * Utah Esports Discord bot.
 *
 * - Posts new/updated events ONLY into org-authorized channels.
 * - Slash commands read the canonical site database (same permissions).
 * - No private-server scraping; destinations are explicitly configured.
 */

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.warn(
    JSON.stringify({
      level: "warn",
      job: "discord-bot",
      message:
        "DISCORD_TOKEN not set — bot is idle (set it in .env to enable announcements/commands)",
    }),
  );
  // Exit cleanly so `pnpm dev` shows a notice instead of a failure.
  process.exit(0);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.GuildMember],
});

client.once(Events.ClientReady, (ready) => {
  console.log(
    JSON.stringify({
      level: "info",
      job: "discord-bot",
      message: `logged in as ${ready.user.tag}`,
    }),
  );
  startAnnouncementLoop(client);
  startRosterRoleSync(client);
});

client.on(Events.InteractionCreate, (interaction) => {
  void handleInteraction(interaction).catch((err) => {
    console.error(
      JSON.stringify({
        level: "error",
        job: "discord-bot",
        message: "interaction failed",
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  });
});

client.login(token).catch((err: unknown) => {
  console.warn(
    JSON.stringify({
      level: "warn",
      job: "discord-bot",
      message:
        "login failed — bot idle (check DISCORD_TOKEN in .env; shell-env tokens do not apply)",
      error: err instanceof Error ? err.message : String(err),
    }),
  );
  process.exit(0);
});
