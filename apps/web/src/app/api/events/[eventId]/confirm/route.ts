import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { eventOccurrences, getMembershipsForUser } from "@utah-esports/db";
import { roleHasPermission } from "@utah-esports/core";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";

/**
 * Organizer re-confirmation: flips a needs_verification listing back to
 * published and stamps last_confirmed_at. Membership or moderator required.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { eventId } = await params;
  const database = db();
  const [event] = await database
    .select()
    .from(eventOccurrences)
    .where(eq(eventOccurrences.id, eventId))
    .limit(1);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (event.organizationId) {
    const memberships = await getMembershipsForUser(database, user.id);
    const membership = memberships.find((m) => m.orgId === event.organizationId);
    const canConfirm =
      user.isModerator ||
      (membership !== undefined && roleHasPermission(membership.role, "events:edit"));
    if (!canConfirm) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }
  } else if (!user.isModerator) {
    return NextResponse.json({ error: "Moderator required" }, { status: 403 });
  }

  const [updated] = await database
    .update(eventOccurrences)
    .set({
      status: "published",
      lastConfirmedAt: new Date(),
      confirmedBy: user.id,
      updatedAt: new Date(),
    })
    .where(eq(eventOccurrences.id, eventId))
    .returning();
  if (!updated) return NextResponse.json({ error: "Confirm failed" }, { status: 500 });
  return NextResponse.json({ ok: true, status: updated.status });
}
