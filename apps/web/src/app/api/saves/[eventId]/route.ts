import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { savedEvents } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ saved: false });
  const { eventId } = await params;
  const [row] = await db()
    .select()
    .from(savedEvents)
    .where(and(eq(savedEvents.userId, user.id), eq(savedEvents.eventId, eventId)))
    .limit(1);
  return NextResponse.json({ saved: Boolean(row) });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { eventId } = await params;
  await db()
    .insert(savedEvents)
    .values({ userId: user.id, eventId })
    .onConflictDoNothing();
  return NextResponse.json({ saved: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { eventId } = await params;
  await db()
    .delete(savedEvents)
    .where(and(eq(savedEvents.userId, user.id), eq(savedEvents.eventId, eventId)));
  return NextResponse.json({ saved: false });
}
