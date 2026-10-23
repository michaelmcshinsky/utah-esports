import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { roleHasPermission } from "@utah-esports/core";
import { teamPatchSchema } from "@/src/lib/forms/schemas";
import { getMembershipsForUser, teams } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

async function requireTeamRole(teamId: string, action: "edit" | "delete") {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  const database = db();
  const [team] = await database.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  if (!team) return { error: NextResponse.json({ error: "Team not found" }, { status: 404 }) };
  const memberships = await getMembershipsForUser(database, user.id);
  const membership = memberships.find((m) => m.orgId === team.organizationId);
  const needed = action === "delete" ? "org:manage_members" : "events:edit";
  if (!membership || !roleHasPermission(membership.role, needed)) {
    return {
      error: NextResponse.json(
        { error: action === "delete" ? "Owner access required" : "Editor access required" },
        { status: 403 },
      ),
    };
  }
  return { database, team };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const guard = await requireTeamRole(teamId, "edit");
  if ("error" in guard) return guard.error;
  const { database, team } = guard;

  const body = await request.json().catch(() => null);
  const parsed = teamPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const patch: Partial<typeof teams.$inferInsert> = { updatedAt: new Date() };
  if (d.name !== undefined) patch.name = d.name;
  if (d.pathway !== undefined) patch.pathway = d.pathway;
  if (d.institution !== undefined) patch.institution = d.institution?.trim() || null;
  if (d.city !== undefined) patch.city = d.city?.trim() || null;
  if (d.tryoutInfo !== undefined) patch.tryoutInfo = d.tryoutInfo?.trim() || null;
  if (d.websiteUrl !== undefined) patch.websiteUrl = d.websiteUrl || null;
  if (d.description !== undefined) patch.description = d.description?.trim() || null;
  if (d.discordRoleId !== undefined) patch.discordRoleId = d.discordRoleId || null;
  const [updated] = await database
    .update(teams)
    .set(patch)
    .where(eq(teams.id, team.id))
    .returning();
  return NextResponse.json({ id: updated?.id, slug: team.slug });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const guard = await requireTeamRole(teamId, "delete");
  if ("error" in guard) return guard.error;
  await guard.database.delete(teams).where(eq(teams.id, teamId));
  return NextResponse.json({ ok: true });
}
