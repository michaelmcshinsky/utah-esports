import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import {
  discordLinkCodes,
  eventGames,
  eventOccurrences,
  games,
  organizationMemberships,
  teamMembers,
  teams,
  userDiscordLinks,
  userProfiles,
  getDb,
} from "@utah-esports/db";
import { roleHasPermission } from "@utah-esports/core";

export const commands = [
  new SlashCommandBuilder()
    .setName("events")
    .setDescription("Find upcoming Utah gaming events")
    .addStringOption((o) =>
      o.setName("game").setDescription("Game name, e.g. Valorant").setRequired(false),
    )
    .addStringOption((o) =>
      o
        .setName("when")
        .setDescription("Time window")
        .addChoices(
          { name: "Today", value: "today" },
          { name: "This week", value: "week" },
          { name: "This month", value: "month" },
        )
        .setRequired(false),
    )
    .addStringOption((o) =>
      o.setName("city").setDescription("City, e.g. Provo").setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName("roster")
    .setDescription("View a team roster maintained on utahesports.net")
    .addStringOption((o) =>
      o.setName("team").setDescription("Team name (partial match)").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link your Discord account to your Utah Esports account")
    .addStringOption((o) =>
      o.setName("code").setDescription("Code from utahesports.net/account").setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("roster-admin")
    .setDescription("Manage your team's roster (org editors only)")
    .addStringOption((o) =>
      o
        .setName("action")
        .setDescription("What to do")
        .setRequired(true)
        .addChoices(
          { name: "Add member", value: "add" },
          { name: "Remove member", value: "remove" },
          { name: "Set Discord role", value: "setrole" },
        ),
    )
    .addStringOption((o) =>
      o.setName("team").setDescription("Team slug on utahesports.net").setRequired(true),
    )
    .addStringOption((o) =>
      o.setName("name").setDescription("Player display name").setRequired(false),
    )
    .addUserOption((o) =>
      o.setName("user").setDescription("Discord user (defaults to you)").setRequired(false),
    )
    .addRoleOption((o) =>
      o.setName("role").setDescription("Role assigned to active roster members").setRequired(false),
    ),
].map((c) => c.toJSON());

export async function handleInteraction(interaction: unknown) {
  if (!isChatInputCommand(interaction)) return;
  await interaction.deferReply({ ephemeral: true });
  const db = getDb();
  const name = interaction.commandName;

  if (name === "events") {
    const game = interaction.options.getString("game");
    const when = interaction.options.getString("when") ?? "week";
    const city = interaction.options.getString("city");
    const now = new Date();
    const horizon =
      when === "today"
        ? new Date(now.getTime() + 24 * 60 * 60 * 1000)
        : when === "week"
          ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const rows = await db
      .select({ event: eventOccurrences })
      .from(eventOccurrences)
      .where(
        and(
          inArray(eventOccurrences.status, ["published", "needs_verification"] as const),
          gt(eventOccurrences.startsAt, now),
        ),
      )
      .orderBy(eventOccurrences.startsAt)
      .limit(50);

    const filtered = [];
    for (const { event } of rows) {
      if (event.startsAt > horizon) continue;
      if (city && !event.city?.toLowerCase().includes(city.toLowerCase())) continue;
      if (game) {
        const gameRows = await db
          .select({ game: games })
          .from(eventGames)
          .innerJoin(games, eq(eventGames.gameId, games.id))
          .where(eq(eventGames.eventId, event.id));
        const q = game.toLowerCase();
        if (!gameRows.some((g) => g.game.name.toLowerCase().includes(q) || g.game.slug.includes(q))) {
          continue;
        }
      }
      filtered.push(event);
      if (filtered.length >= 5) break;
    }

    if (filtered.length === 0) {
      await interaction.editReply("No matching upcoming events. Browse https://utahesports.net/explore");
      return;
    }
    const lines = filtered.map((e) => {
      const whenLabel = e.startsAt.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      const where = e.format === "online" ? "Online" : (e.city ?? "Utah");
      return `• **${e.title}** — ${whenLabel} · ${where}\n  https://utahesports.net/events/${e.slug}`;
    });
    await interaction.editReply(lines.join("\n"));
    return;
  }

  if (name === "roster") {
    const query = interaction.options.getString("team", true).toLowerCase();
    const matches = await db.select().from(teams).limit(50);
    const team = matches.find((t) => t.name.toLowerCase().includes(query));
    if (!team) {
      await interaction.editReply("No team matched. Browse https://utahesports.net/schools");
      return;
    }
    const roster = await db
      .select()
      .from(teamMembers)
      .where(and(eq(teamMembers.teamId, team.id), isNull(teamMembers.leftAt)))
      .limit(25);
    const active = roster;
    const lines = active.length
      ? active.map((m) => `• ${m.displayName} — ${m.role}${m.gameRole ? ` (${m.gameRole})` : ""}`)
      : ["No public roster yet."];
    await interaction.editReply(
      `**${team.name}**\n${lines.join("\n")}\nhttps://utahesports.net/schools`,
    );
    return;
  }

  if (name === "link") {
    const code = interaction.options.getString("code", true).trim().toUpperCase();
    const [row] = await db
      .select()
      .from(discordLinkCodes)
      .where(eq(discordLinkCodes.code, code))
      .limit(1);
    if (!row || row.usedAt || row.expiresAt < new Date()) {
      await interaction.editReply(
        "That code is invalid or expired. Generate a new one at https://utahesports.net/account",
      );
      return;
    }
    await db
      .update(discordLinkCodes)
      .set({ usedAt: new Date(), discordUserId: interaction.user.id })
      .where(eq(discordLinkCodes.id, row.id));
    if (row.userId) {
      await db
        .insert(userDiscordLinks)
        .values({
          userId: row.userId,
          discordUserId: interaction.user.id,
          discordUsername: interaction.user.tag,
        })
        .onConflictDoNothing();
      const [profile] = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.id, row.userId))
        .limit(1);
      await interaction.editReply(
        `Linked to ${profile?.email ?? "your Utah Esports account"}. Team roles sync automatically when you join rosters.`,
      );
    } else {
      await interaction.editReply("Code recorded — finish linking on the website.");
    }
    return;
  }

  if (name === "roster-admin") {
    const action = interaction.options.getString("action", true);
    const teamSlug = interaction.options.getString("team", true).trim().toLowerCase();
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.slug, teamSlug))
      .limit(1);
    if (!team) {
      await interaction.editReply(
        `No team with slug \`${teamSlug}\`. Find slugs at https://utahesports.net/schools`,
      );
      return;
    }

    const allowed = await requireTeamEditor(team.organizationId, interaction.user.id);
    if (!allowed) {
      await interaction.editReply(
        "You need an editor/owner role on this team's organization (or platform moderator). Link your account first with /link.",
      );
      return;
    }

    if (action === "add") {
      const displayName =
        interaction.options.getString("name") ??
        (await linkedDisplayName(interaction.user.id)) ??
        interaction.user.username;
      const targetUser = interaction.options.getUser("user");
      const discordUserId = targetUser?.id ?? interaction.user.id;
      await db
        .insert(teamMembers)
        .values({
          teamId: team.id,
          displayName,
          role: "player",
          discordUserId: discordUserId ?? null,
        })
        .returning();
      await interaction.editReply(
        `Added **${displayName}** to ${team.name}${discordUserId ? " (Discord linked — role sync will assign the team role)" : ""}.`,
      );
      return;
    }

    if (action === "remove") {
      const displayName = interaction.options.getString("name");
      if (!displayName) {
        await interaction.editReply("Provide the player's display name to remove.");
        return;
      }
      const [member] = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, team.id),
            eq(teamMembers.displayName, displayName),
            isNull(teamMembers.leftAt),
          ),
        )
        .limit(1);
      if (!member) {
        await interaction.editReply(`No active member named **${displayName}** on ${team.name}.`);
        return;
      }
      await db
        .update(teamMembers)
        .set({ leftAt: new Date() })
        .where(eq(teamMembers.id, member.id));
      await interaction.editReply(`Removed **${displayName}** from ${team.name}.`);
      return;
    }

    if (action === "setrole") {
      const role = interaction.options.getRole("role");
      if (!role) {
        await interaction.editReply("Mention the Discord role to assign to active members.");
        return;
      }
      await db
        .update(teams)
        .set({ discordRoleId: role.id, updatedAt: new Date() })
        .where(eq(teams.id, team.id));
      await interaction.editReply(
        `Roster role for **${team.name}** set to @${role.name}. Active linked members will receive it within 10 minutes.`,
      );
      return;
    }
  }
}

/** Editor/owner on the team's org, or platform moderator. */
async function requireTeamEditor(
  organizationId: string | null,
  discordUserId: string,
): Promise<boolean> {
  if (!organizationId) return false;
  const db = getDb();
  const [link] = await db
    .select()
    .from(userDiscordLinks)
    .where(eq(userDiscordLinks.discordUserId, discordUserId))
    .limit(1);
  if (!link) return false;
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, link.userId))
    .limit(1);
  if (profile?.isModerator) return true;
  const [membership] = await db
    .select()
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.userId, link.userId),
        eq(organizationMemberships.organizationId, organizationId),
      ),
    )
    .limit(1);
  return Boolean(membership && roleHasPermission(membership.role, "events:edit"));
}

async function linkedDisplayName(discordUserId: string): Promise<string | null> {
  const db = getDb();
  const [link] = await db
    .select()
    .from(userDiscordLinks)
    .where(eq(userDiscordLinks.discordUserId, discordUserId))
    .limit(1);
  if (!link) return null;
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, link.userId))
    .limit(1);
  return profile?.displayName ?? null;
}

function isChatInputCommand(
  interaction: unknown,
): interaction is ChatInputCommandInteraction {
  return (
    typeof interaction === "object" &&
    interaction !== null &&
    "isChatInputCommand" in interaction &&
    (interaction as { isChatInputCommand: () => boolean }).isChatInputCommand()
  );
}
