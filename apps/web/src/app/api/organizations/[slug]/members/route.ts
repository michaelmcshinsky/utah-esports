import { NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { roleHasPermission } from "@utah-esports/core";
import { z } from "zod";
import {
  getMembershipsForUser,
  organizationMemberships,
  organizations,
  userProfiles,
} from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

/**
 * Member management (owner-only — org:manage_members):
 * POST   { email, role }            add/upgrade a signed-up user by email
 * PATCH  { membershipId, role }     change a member's role
 * DELETE ?membershipId=…            remove a member (last owner protected)
 */

async function requireOwner(orgSlug: string) {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  const database = db();
  const [org] = await database
    .select()
    .from(organizations)
    .where(eq(organizations.slug, orgSlug))
    .limit(1);
  if (!org) return { error: NextResponse.json({ error: "Organization not found" }, { status: 404 }) };
  const memberships = await getMembershipsForUser(database, user.id);
  const membership = memberships.find((m) => m.orgId === org.id);
  if (!membership || !roleHasPermission(membership.role, "org:manage_members")) {
    return { error: NextResponse.json({ error: "Owner access required" }, { status: 403 }) };
  }
  return { database, org };
}

const addSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(200),
  role: z.enum(["owner", "editor", "viewer"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const guard = await requireOwner(slug);
  if ("error" in guard) return guard.error;
  const { database, org } = guard;

  const body = await request.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }
  const [profile] = await database
    .select()
    .from(userProfiles)
    .where(sql`lower(${userProfiles.email}) = lower(${parsed.data.email})`)
    .limit(1);
  if (!profile) {
    return NextResponse.json(
      { error: "No account uses that email yet — ask them to sign in first." },
      { status: 404 },
    );
  }
  const [existing] = await database
    .select()
    .from(organizationMemberships)
    .where(
      and(
        eq(organizationMemberships.organizationId, org.id),
        eq(organizationMemberships.userId, profile.id),
      ),
    )
    .limit(1);
  if (existing) {
    if (existing.role === parsed.data.role) {
      return NextResponse.json({ error: "They're already a member with that role" }, { status: 409 });
    }
    await database
      .update(organizationMemberships)
      .set({ role: parsed.data.role })
      .where(eq(organizationMemberships.id, existing.id));
    return NextResponse.json({ ok: true, upgraded: true });
  }
  const [added] = await database
    .insert(organizationMemberships)
    .values({ organizationId: org.id, userId: profile.id, role: parsed.data.role })
    .returning();
  return NextResponse.json({ ok: true, id: added?.id }, { status: 201 });
}

const patchSchema = z.object({
  membershipId: z.string().uuid(),
  role: z.enum(["owner", "editor", "viewer"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const guard = await requireOwner(slug);
  if ("error" in guard) return guard.error;
  const { database, org } = guard;

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const [membership] = await database
    .select()
    .from(organizationMemberships)
    .where(eq(organizationMemberships.id, parsed.data.membershipId))
    .limit(1);
  if (!membership || membership.organizationId !== org.id) {
    return NextResponse.json({ error: "Membership not found" }, { status: 404 });
  }
  if (membership.role === "owner" && parsed.data.role !== "owner") {
    const [others] = await database
      .select({ count: sql<number>`count(*)::int` })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, org.id),
          eq(organizationMemberships.role, "owner"),
          ne(organizationMemberships.id, membership.id),
        ),
      );
    if ((others?.count ?? 0) === 0) {
      return NextResponse.json(
        { error: "Promote another member to owner before changing this one." },
        { status: 400 },
      );
    }
  }
  await database
    .update(organizationMemberships)
    .set({ role: parsed.data.role })
    .where(eq(organizationMemberships.id, membership.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const guard = await requireOwner(slug);
  if ("error" in guard) return guard.error;
  const { database, org } = guard;

  const membershipId = new URL(request.url).searchParams.get("membershipId");
  if (!membershipId) {
    return NextResponse.json({ error: "membershipId required" }, { status: 400 });
  }
  const [membership] = await database
    .select()
    .from(organizationMemberships)
    .where(eq(organizationMemberships.id, membershipId))
    .limit(1);
  if (!membership || membership.organizationId !== org.id) {
    return NextResponse.json({ error: "Membership not found" }, { status: 404 });
  }
  if (membership.role === "owner") {
    const [others] = await database
      .select({ count: sql<number>`count(*)::int` })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, org.id),
          eq(organizationMemberships.role, "owner"),
          ne(organizationMemberships.id, membership.id),
        ),
      );
    if ((others?.count ?? 0) === 0) {
      return NextResponse.json(
        { error: "You're the last owner — promote someone else first." },
        { status: 400 },
      );
    }
  }
  await database
    .delete(organizationMemberships)
    .where(eq(organizationMemberships.id, membership.id));
  return NextResponse.json({ ok: true });
}
