import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { roleHasPermission, slugify } from "@utah-esports/core";
import { teamFormSchema } from "@/src/lib/forms/schemas";
import { getMembershipsForUser, organizations, teams } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

/** Create a team under an organization (editor+ required). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { slug } = await params;
  const database = db();

  const [org] = await database
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  const memberships = await getMembershipsForUser(database, user.id);
  const membership = memberships.find((m) => m.orgId === org.id);
  if (!membership || !roleHasPermission(membership.role, "events:edit")) {
    return NextResponse.json({ error: "Editor access required" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = teamFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Auto slug with uniqueness fallback.
  let teamSlug = slugify(data.name);
  const [taken] = await database
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.slug, teamSlug))
    .limit(1);
  if (taken) teamSlug = `${teamSlug}-${randomBytes(2).toString("hex")}`;

  const [team] = await database
    .insert(teams)
    .values({
      organizationId: org.id,
      name: data.name,
      slug: teamSlug,
      pathway: data.pathway,
      institution: data.institution?.trim() || null,
      city: data.city?.trim() || null,
      tryoutInfo: data.tryoutInfo?.trim() || null,
      websiteUrl: data.websiteUrl || null,
      description: data.description?.trim() || null,
      discordRoleId: data.discordRoleId || null,
      status: "active",
      lastConfirmedAt: new Date(),
    })
    .returning();
  return NextResponse.json({ id: team?.id, slug: team?.slug }, { status: 201 });
}
