"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import {
  authzEvents,
  auditLogs,
  eventOccurrences,
  eventSubmissions,
  roles,
  userPlatformRoles,
} from "@utah-esports/db";
import {
  PLATFORM_ROLES,
  canAssignPlatformRole,
  platformRoleKey,
  platformRoleRank,
} from "@utah-esports/core";
import { db } from "@/src/lib/db";
import { authorization } from "@/src/lib/authz";
import { getSessionUser } from "@/src/lib/session";
import { verifyCsrfFromForm } from "@/src/lib/csrf";

const EVENT_STATUSES = [
  "draft",
  "published",
  "postponed",
  "cancelled",
  "needs_verification",
] as const;

type GuardResult =
  | { ok: true; userId: string; permissions: readonly string[]; roleKeys: readonly string[] }
  | { ok: false; error: string };

/**
 * Shared admin guard for server actions. checkPlatformPermission both
 * decides and audits denials to `authz_events`, so a refused action is
 * visible even when the form just shows "Not authorized".
 */
async function guard(permission: string, formData?: FormData): Promise<GuardResult> {
  if (formData && !(await verifyCsrf(formData))) {
    return { ok: false, error: "Invalid CSRF token" };
  }
  const user = await getSessionUser();
  const decision = await authorization.checkPlatformPermission(user?.id ?? null, permission, {
    resourceType: "admin",
  });
  if (!decision.allowed) {
    return {
      ok: false,
      error: decision.reason === "unauthenticated" ? "Sign in required" : "Not authorized",
    };
  }
  const user2 = user!;
  const [permissions, roleKeys] = await Promise.all([
    authorization.getPlatformPermissions(user2.id),
    authorization.getPlatformRoleKeys(user2.id),
  ]);
  return { ok: true, userId: user2.id, permissions, roleKeys };
}

async function verifyCsrf(formData: FormData): Promise<boolean> {
  return verifyCsrfFromForm(formData);
}

async function writeAudit(
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  before: unknown,
  after: unknown,
) {
  await db().insert(auditLogs).values({
    actorId,
    action,
    targetType,
    targetId,
    before: before ?? null,
    after: after ?? null,
  });
}

export async function setEventStatus(formData: FormData) {
  const g = await guard("platform:manage_content", formData);
  if (!g.ok) redirect(`/admin?error=${encodeURIComponent(g.error)}`);

  const eventId = String(formData.get("eventId") ?? "");
  const next = String(formData.get("status") ?? "");
  if (!eventId || !EVENT_STATUSES.includes(next as (typeof EVENT_STATUSES)[number])) {
    redirect("/admin/events?error=Invalid+status+or+event");
  }

  const [before] = await db()
    .select({ status: eventOccurrences.status })
    .from(eventOccurrences)
    .where(eq(eventOccurrences.id, eventId))
    .limit(1);
  if (!before) redirect("/admin/events?error=Event+not+found");

  await db()
    .update(eventOccurrences)
    .set({ status: next as (typeof EVENT_STATUSES)[number] })
    .where(eq(eventOccurrences.id, eventId));

  await writeAudit(g.userId, "event.status_change", "event", eventId, before.status, next);
  revalidatePath("/admin/events");
  revalidatePath("/admin");
  redirect("/admin/events?ok=Status+updated");
}

export async function reviewSubmission(formData: FormData) {
  const g = await guard("platform:moderate", formData);
  if (!g.ok) redirect(`/admin?error=${encodeURIComponent(g.error)}`);

  const submissionId = String(formData.get("submissionId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const notes = String(formData.get("notes") ?? "") || null;
  if (!submissionId || !["approved", "rejected", "pending"].includes(decision)) {
    redirect("/admin/submissions?error=Invalid+decision");
  }

  const [before] = await db()
    .select({ status: eventSubmissions.status })
    .from(eventSubmissions)
    .where(eq(eventSubmissions.id, submissionId))
    .limit(1);
  if (!before) redirect("/admin/submissions?error=Submission+not+found");

  await db()
    .update(eventSubmissions)
    .set({ status: decision, reviewedBy: g.userId, reviewedAt: new Date(), reviewNotes: notes })
    .where(eq(eventSubmissions.id, submissionId));

  await writeAudit(g.userId, "submission.review", "event_submission", submissionId, before.status, {
    status: decision,
    notes,
  });
  revalidatePath("/admin/submissions");
  revalidatePath("/admin");
  redirect("/admin/submissions?ok=Submission+updated");
}

export async function setUserRole(formData: FormData) {
  const g = await guard("platform:grant_roles", formData);
  if (!g.ok) redirect(`/admin?error=${encodeURIComponent(g.error)}`);

  const targetUserId = String(formData.get("userId") ?? "");
  const roleKey = String(formData.get("roleKey") ?? "");
  const mode = String(formData.get("mode") ?? "");
  if (
    !targetUserId ||
    !roleKey ||
    !["grant", "revoke"].includes(mode) ||
    !PLATFORM_ROLES.some((r) => r.key === roleKey)
  ) {
    redirect("/admin/users?error=Invalid+role+request");
  }

  // Privilege-escalation guard: grantor must outrank the target role.
  const targetKey = platformRoleKey(roleKey);
  if (!canAssignPlatformRole(g.permissions as string[], g.roleKeys as string[], targetKey)) {
    redirect("/admin/users?error=Escalation+denied");
  }

  const [roleRow] = await db()
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.key, targetKey))
    .limit(1);
  if (!roleRow) redirect("/admin/users?error=Role+missing+from+database seeding");
  const roleId = roleRow.id;

  if (mode === "grant") {
    await db()
      .insert(userPlatformRoles)
      .values({ userId: targetUserId, roleId, grantedBy: g.userId })
      .onConflictDoNothing();
  } else {
    await db()
      .delete(userPlatformRoles)
      .where(and(eq(userPlatformRoles.userId, targetUserId), eq(userPlatformRoles.roleId, roleId)));
  }

  await db().insert(authzEvents).values({
    actorId: g.userId,
    action: mode === "grant" ? "role.granted" : "role.revoked",
    scope: "platform",
    resourceType: "user",
    resourceId: targetUserId,
    permission: targetKey,
    decision: "allow",
    context: { via: "admin-app", rank: platformRoleRank(targetKey) },
  });
  authorization.invalidate(targetUserId);

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  redirect("/admin/users?ok=Platform+role+updated");
}
