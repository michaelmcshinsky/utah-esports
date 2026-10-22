import "./env.js";
import { REST, Routes } from "discord.js";
import { commands } from "./commands.js";

/**
 * Registers slash commands with Discord. Run after changing commands:
 *   DISCORD_TOKEN=... DISCORD_CLIENT_ID=... pnpm register-commands
 * Optionally set DISCORD_GUILD_ID to register to one guild instantly.
 */

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token || !clientId) {
  console.error("DISCORD_TOKEN and DISCORD_CLIENT_ID are required");
  process.exit(1);
}

const appClientId: string = clientId;
const rest = new REST({ version: "10" }).setToken(token);

async function main() {
  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(appClientId, guildId), { body: commands });
    console.log(`Registered ${commands.length} guild commands to ${guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(appClientId), { body: commands });
    console.log(`Registered ${commands.length} global commands`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
