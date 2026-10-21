import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { eventEditSchema, roleHasPermission, slugify } from "@utah-esports/core";
import {
  eventOccurrences,
  eventGames,
  games,
  getMembershipsForUser,
  getOrganizationBySlug,
  type Database,
} from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

async function requireOrgEditor(organizationSlug: string, userId: string) {
  const database = db();
  const org = await getOrganizationBySlug(database, organizationSlug);
  if (!org) return null;
  const memberships = await getMembershipsForUser(database, userId);
  const membership = memberships.find((m) => m.orgId === org.id);
  if (!membership || !roleHasPermission(membership.role, "events:create")) return null;
  return { database, org };
}

async function linkGames(database: Database, eventId: string, names: string[]) {
  for (const name of names) {
    const gameSlug = slugify(name);
    let [game] = await database
      .select()
      .from(games)
      .where(eq(games.slug, gameSlug))
      .limit(1);
    if (!game) {
      [game] = await database.insert(games).values({ slug: gameSlug, name }).returning();
    }
    if (game) {
      await database
        .insert(eventGames)
        .values({ eventId, gameId: game.id })
        .onConflictDoNothing();
    }
  }
}

export async function createEventFromRequest(request: Request, userId: string) {
  const body = (await request.json().catch(() => null)) as
    | (Record<string, unknown> & { organizationSlug?: string })
    | null;
  const parsed = eventEditSchema.safeParse(body);
  if (!parsed.success || !body?.organizationSlug) {
    return NextResponse.json(
      { error: parsed.success ? "organizationSlug required" : (parsed.error.issues[0]?.message ?? "Validation failed") },
      { status: 400 },
    );
  }
  const resolved = await requireOrgEditor(body.organizationSlug, userId);
  if (!resolved) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const { database, org } = resolved;
  const data = parsed.data;
  const [event] = await database
    .insert(eventOccurrences)
    .values({
      title: data.title,
      description: data.description ?? null,
      eventType: data.eventType,
      format: data.format,
      startsAt: new Date(data.startsAt),
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      city: data.city ?? null,
      registrationUrl: data.registrationUrl ?? data.url ?? null,
      registrationState: data.registrationState,
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
      agePolicy: data.agePolicy,
      skillLevel: data.skillLevel,
      beginnerFriendly: data.beginnerFriendly,
      youthProgram: data.youthProgram,
      priceCents: data.priceCents ?? null,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      organizationId: org.id,
      status: data.status,
      slug: `${new Date(data.startsAt).toISOString().slice(0, 10)}-${slugify(data.title)}-${org.slug.slice(0, 8)}`,
      publishedAt: data.status === "published" ? new Date() : null,
      lastConfirmedAt: new Date(),
      createdById: userId,
    })
    .returning();
  if (event) await linkGames(database, event.id, data.gameNames);
  return NextResponse.json({ id: event?.id, slug: event?.slug }, { status: 201 });
}

export async function patchEventFromRequest(
  request: Request,
  userId: string,
  eventId: string,
) {
  const body = (await request.json().catch(() => null)) as
    | (Record<string, unknown> & { organizationSlug?: string })
    | null;
  const parsed = eventEditSchema.partial().safeParse(body);
  if (!parsed.success || !body?.organizationSlug) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const resolved = await requireOrgEditor(body.organizationSlug, userId);
  if (!resolved) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  const { database } = resolved;
  const data = parsed.data;
  const patch: Partial<typeof eventOccurrences.$inferInsert> = { updatedAt: new Date() };
  if (data.title) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description;
  if (data.eventType) patch.eventType = data.eventType;
  if (data.format) patch.format = data.format;
  if (data.startsAt) patch.startsAt = new Date(data.startsAt);
  if (data.endsAt) patch.endsAt = new Date(data.endsAt);
  if (data.city !== undefined) patch.city = data.city;
  if (data.registrationUrl) patch.registrationUrl = data.registrationUrl;
  if (data.registrationState) patch.registrationState = data.registrationState;
  if (data.registrationDeadline) patch.registrationDeadline = new Date(data.registrationDeadline);
  if (data.agePolicy) patch.agePolicy = data.agePolicy;
  if (data.skillLevel) patch.skillLevel = data.skillLevel;
  if (data.beginnerFriendly !== undefined) patch.beginnerFriendly = data.beginnerFriendly;
  if (data.youthProgram !== undefined) patch.youthProgram = data.youthProgram;
  if (data.priceCents !== undefined) patch.priceCents = data.priceCents;
  if (data.contactName) patch.contactName = data.contactName;
  if (data.contactEmail) patch.contactEmail = data.contactEmail;
  if (data.status) {
    patch.status = data.status;
    if (data.status === "published") patch.publishedAt = new Date();
  }
  if (data.gameNames?.length) {
    await linkGames(database, eventId, data.gameNames);
  }
  const [updated] = await database
    .update(eventOccurrences)
    .set(patch)
    .where(eq(eventOccurrences.id, eventId))
    .returning();
  return NextResponse.json({ id: updated?.id });
}

export async function handleEventCreate(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  return createEventFromRequest(request, user.id);
}

export async function handleEventPatch(request: Request, eventId: string) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  return patchEventFromRequest(request, user.id, eventId);
}
