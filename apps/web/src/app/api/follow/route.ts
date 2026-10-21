import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { eventFollows, follows } from "@utah-esports/db";
import { FOLLOW_KINDS } from "@utah-esports/core";
import { z } from "zod";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

const followSchema = z.object({
  kind: z.enum([...FOLLOW_KINDS, "event"]),
  targetId: z.string().uuid(),
});

function tables(kind: string) {
  return kind === "event" ? "event" : "generic";
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ following: false });
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const targetId = searchParams.get("targetId");
  if (!kind || !targetId) return NextResponse.json({ following: false });
  const database = db();
  if (tables(kind) === "event") {
    const [row] = await database
      .select()
      .from(eventFollows)
      .where(and(eq(eventFollows.userId, user.id), eq(eventFollows.eventId, targetId)))
      .limit(1);
    return NextResponse.json({ following: Boolean(row) });
  }
  const [row] = await database
    .select()
    .from(follows)
    .where(
      and(
        eq(follows.userId, user.id),
        eq(follows.kind, kind as never),
        eq(follows.targetId, targetId),
      ),
    )
    .limit(1);
  return NextResponse.json({ following: Boolean(row) });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = followSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  const { kind, targetId } = parsed.data;
  const database = db();
  if (kind === "event") {
    await database
      .insert(eventFollows)
      .values({ userId: user.id, eventId: targetId })
      .onConflictDoNothing();
  } else {
    await database
      .insert(follows)
      .values({ userId: user.id, kind: kind as never, targetId })
      .onConflictDoNothing();
  }
  return NextResponse.json({ following: true });
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const targetId = searchParams.get("targetId");
  if (!kind || !targetId) return NextResponse.json({ error: "kind and targetId required" }, { status: 400 });
  const database = db();
  if (kind === "event") {
    await database
      .delete(eventFollows)
      .where(and(eq(eventFollows.userId, user.id), eq(eventFollows.eventId, targetId)));
  } else {
    await database
      .delete(follows)
      .where(
        and(
          eq(follows.userId, user.id),
          eq(follows.kind, kind as never),
          eq(follows.targetId, targetId),
        ),
      );
  }
  return NextResponse.json({ following: false });
}
