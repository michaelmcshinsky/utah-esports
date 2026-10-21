import type { Client } from "discord.js";
import { and, eq, isNull } from "drizzle-orm";
import { orgDiscordConfigs, teamMembers, teams, getDb } from "@utah-esports/db";
import { log } from "./logger.js";

/**
 * Roster role sync: active roster members with linked Discord ids receive
 * their team's configured role (set via /roster-admin setrole). Runs on an
 * interval; failures on individual members never break the loop.
 */
export function startRosterRoleSync(client: Client) {
  const tick = async () => {
    try {
      await syncRosterRoles(client);
    } catch (err) {
      log("error", "roster-sync", "tick failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };
  void tick();
  setInterval(tick, 10 * 60 * 1000);
}

export async function syncRosterRoles(client: Client): Promise<{ assigned: number }> {
  const db = getDb();
  const rows = await db
    .select({ team: teams, config: orgDiscordConfigs })
    .from(teams)
    .innerJoin(orgDiscordConfigs, eq(teams.organizationId, orgDiscordConfigs.organizationId))
    .where(eq(orgDiscordConfigs.enabled, true))
    .limit(100);

  let assigned = 0;
  for (const { team, config } of rows) {
    if (!team.discordRoleId || !config.guildId) continue;
    const members = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, team.id), isNull(teamMembers.leftAt)))
      .limit(50);
    for (const member of members) {
      if (!member.discordUserId) continue;
      try {
        const guild = await client.guilds.fetch(config.guildId);
        const guildMember = await guild.members.fetch(member.discordUserId);
        if (!guildMember) continue;
        const roles = guildMember.roles;
        const hasRole = roles.cache.has(team.discordRoleId);
        if (!hasRole) {
          await roles.add(team.discordRoleId, `roster:${team.slug}`);
          assigned++;
        }
      } catch {
        // Member not in guild or role missing — skip silently.
      }
    }
  }
  if (assigned > 0) {
    log("info", "roster-sync", "assigned roles", { assigned });
  }
  return { assigned };
}
