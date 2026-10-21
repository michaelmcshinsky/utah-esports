import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { slugify, type EventSubmissionInput } from "@utah-esports/core";
import {
  auditLogs,
  eventOccurrences,
  eventSubmissions,
  moderationActions,
  organizations,
  organizationClaims,
  organizationMemberships,
  duplicateCandidates,
  sourceRecords,
  reports,
} from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";
import { linkEventGames } from "@/src/lib/event-api";

/**
 * Moderator console actions. Every action writes moderation_actions +
 * audit_logs — sensitive decisions stay human and recorded.
 */

export type ModerationTarget = "submission" | "report" | "claim" | "duplicate";
export type ModerationActionName =
  | "submission:approve"
  | "submission:reject"
  | "report:resolve"
  | "report:dismiss"
  | "claim:approve"
  | "claim:deny"
  | "duplicate:keep_existing"
  | "duplicate:allow_import";

const ALLOWED: Record<ModerationTarget, string[]> = {
  submission: ["approve", "reject"],
  report: ["resolve", "dismiss"],
  claim: ["approve", "deny"],
  duplicate: ["keep_existing", "allow_import"],
};

export async function handleModerationAction(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!user.isModerator) {
    return NextResponse.json({ error: "Moderator access required" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    targetType?: ModerationTarget;
    id?: string;
    action?: string;
    notes?: string;
  } | null;
  const targetType = body?.targetType;
  const id = body?.id;
  const action = body?.action;
  if (!targetType || !id || !action || !ALLOWED[targetType]?.includes(action)) {
    return NextResponse.json({ error: "Invalid moderation request" }, { status: 400 });
  }

  const database = db();
  const fullName = `${targetType}:${action}` as ModerationActionName;

  try {
    let summary = "";
    if (targetType === "submission") {
      const [submission] = await database
        .select()
        .from(eventSubmissions)
        .where(eq(eventSubmissions.id, id))
        .limit(1);
      if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (submission.status !== "pending") {
        return NextResponse.json({ error: "Already reviewed" }, { status: 409 });
      }
      let eventId: string | null = null;
      if (action === "approve") {
        const payload = submission.payload as unknown as EventSubmissionInput;
        const startDate = new Date(payload.startsAt);
        const slug = `${startDate.toISOString().slice(0, 10)}-${slugify(payload.title)}-${Math.random().toString(36).slice(2, 6)}`;
        const [event] = await database
          .insert(eventOccurrences)
          .values({
            slug,
            title: payload.title,
            description: payload.description ?? null,
            eventType: payload.eventType,
            format: payload.format,
            startsAt: startDate,
            endsAt: payload.endsAt ? new Date(payload.endsAt) : null,
            city: payload.city ?? null,
            onlineUrl: payload.onlineUrl ?? null,
            agePolicy: payload.agePolicy,
            skillLevel: payload.skillLevel,
            entryMode: payload.entryMode,
            platforms: payload.platforms,
            beginnerFriendly: payload.beginnerFriendly,
            youthProgram: payload.youthProgram,
            priceCents: payload.priceCents ?? null,
            priceNote: payload.priceNote ?? null,
            venueFeeCents: payload.venueFeeCents ?? null,
            registrationUrl: payload.registrationUrl ?? payload.url,
            registrationState: payload.registrationState,
            registrationDeadline: payload.registrationDeadline
              ? new Date(payload.registrationDeadline)
              : null,
            contactName: payload.contactName,
            contactEmail: payload.contactEmail,
            status: "published",
            publishedAt: new Date(),
            lastConfirmedAt: new Date(),
            createdById: submission.submittedBy,
          })
          .returning();
        if (event) {
          eventId = event.id;
          await linkEventGames(database, event.id, payload.gameNames);
          summary = `published "${payload.title}"`;
        }
      } else {
        summary = `rejected submission "${String((submission.payload as { title?: string }).title ?? id)}"`;
      }
      await database
        .update(eventSubmissions)
        .set({
          status: action === "approve" ? "approved" : "rejected",
          reviewedBy: user.id,
          reviewedAt: new Date(),
          reviewNotes: body.notes ?? null,
          eventId,
        })
        .where(eq(eventSubmissions.id, id));
    } else if (targetType === "report") {
      const [report] = await database
        .select()
        .from(reports)
        .where(eq(reports.id, id))
        .limit(1);
      if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await database
        .update(reports)
        .set({
          status: action === "resolve" ? "resolved" : "dismissed",
          reviewedBy: user.id,
          reviewedAt: new Date(),
        })
        .where(eq(reports.id, id));
      summary = `${action} report on ${report.targetType} ${report.reason}`;
    } else if (targetType === "claim") {
      const [claim] = await database
        .select()
        .from(organizationClaims)
        .where(eq(organizationClaims.id, id))
        .limit(1);
      if (!claim) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (action === "approve") {
        await database
          .update(organizations)
          .set({ claimedAt: new Date(), verifiedAt: new Date() })
          .where(eq(organizations.id, claim.organizationId));
        // Ensure the claimer can actually edit: promote to owner if no role yet.
        const [existingMembership] = await database
          .select()
          .from(organizationMemberships)
          .where(eq(organizationMemberships.userId, claim.userId))
          .limit(1);
        if (!existingMembership) {
          await database.insert(organizationMemberships).values({
            organizationId: claim.organizationId,
            userId: claim.userId,
            role: "owner",
          });
        }
      }
      await database
        .update(organizationClaims)
        .set({
          status: action === "approve" ? "approved" : "denied",
          reviewedBy: user.id,
          reviewedAt: new Date(),
          reviewNotes: body.notes ?? null,
        })
        .where(eq(organizationClaims.id, id));
      summary = `${action} claim ${claim.proofUrl}`;
    } else if (targetType === "duplicate") {
      const [candidate] = await database
        .select()
        .from(duplicateCandidates)
        .where(eq(duplicateCandidates.id, id))
        .limit(1);
      if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await database
        .update(duplicateCandidates)
        .set({
          status: action === "keep_existing" ? "merged" : "rejected",
          reviewedBy: user.id,
          reviewedAt: new Date(),
        })
        .where(eq(duplicateCandidates.id, id));
      if (action === "keep_existing" && candidate.candidateSourceRecordId) {
        await database
          .update(sourceRecords)
          .set({ status: "ignored" })
          .where(eq(sourceRecords.id, candidate.candidateSourceRecordId));
      }
      summary = `${action} (score ${candidate.score})`;
    }

    await database.insert(moderationActions).values({
      actorId: user.id,
      action: fullName,
      targetType,
      targetId: id,
      notes: body.notes ?? summary,
    });
    await database.insert(auditLogs).values({
      actorId: user.id,
      action: fullName,
      targetType,
      targetId: id,
      after: { action, notes: body.notes ?? null },
    });
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Action failed" },
      { status: 500 },
    );
  }
}
