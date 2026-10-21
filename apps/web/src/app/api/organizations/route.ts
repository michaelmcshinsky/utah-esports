import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { organizationCreateSchema } from "@utah-esports/core";
import { organizations, organizationMemberships } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = organizationCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }
  const database = db();
  const [existing] = await database
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, parsed.data.slug))
    .limit(1);
  if (existing) {
    return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
  }
  const [org] = await database
    .insert(organizations)
    .values({
      name: parsed.data.name,
      slug: parsed.data.slug,
      kind: parsed.data.kind,
      contactEmail: parsed.data.contactEmail,
      city: parsed.data.city ?? null,
      websiteUrl: parsed.data.websiteUrl ?? null,
      description: parsed.data.description ?? null,
    })
    .returning();
  if (org) {
    await database.insert(organizationMemberships).values({
      organizationId: org.id,
      userId: user.id,
      role: "owner",
    });
  }
  return NextResponse.json({ id: org?.id, slug: org?.slug }, { status: 201 });
}
