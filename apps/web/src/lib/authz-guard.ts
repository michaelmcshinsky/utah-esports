import { NextResponse } from "next/server";
import { authorization, type DenialMeta } from "./authz.js";
import { getSessionUser, type SessionUser } from "./session.js";

/**
 * HTTP authorization guards. Every route follows the same protocol:
 *
 *   const guard = await requirePlatformPermission("platform:moderate");
 *   if ("error" in guard) return guard.error;
 *   const { user } = guard;
 *
 * 401 = unauthenticated, 403 = authenticated but denied (and audited to
 * `authz_events`). Messages are deliberately uniform across scopes so error
 * responses never disclose which roles exist or why access was refused.
 */

export type AuthzGuard = { user: SessionUser } | { error: NextResponse };

const UNAUTHENTICATED = () => NextResponse.json({ error: "Sign in required" }, { status: 401 });
const FORBIDDEN = () => NextResponse.json({ error: "Not authorized" }, { status: 403 });

export async function requireSession(): Promise<AuthzGuard> {
  const user = await getSessionUser();
  if (!user) return { error: UNAUTHENTICATED() };
  return { user };
}

export async function requirePlatformPermission(
  permission: string,
  meta?: DenialMeta,
): Promise<AuthzGuard> {
  const user = await getSessionUser();
  const decision = await authorization.checkPlatformPermission(user?.id ?? null, permission, meta);
  if (!decision.allowed) {
    return { error: decision.reason === "unauthenticated" ? UNAUTHENTICATED() : FORBIDDEN() };
  }
  return { user: user! };
}

export async function requireOrgPermission(
  orgId: string,
  permission: string,
  meta?: DenialMeta,
): Promise<AuthzGuard> {
  const user = await getSessionUser();
  const decision = await authorization.checkOrgPermission(user?.id ?? null, orgId, permission, {
    ...meta,
    resourceType: meta?.resourceType ?? "organization",
    resourceId: meta?.resourceId ?? orgId,
  });
  if (!decision.allowed) {
    return { error: decision.reason === "unauthenticated" ? UNAUTHENTICATED() : FORBIDDEN() };
  }
  return { user: user! };
}

export async function requirePagePermission(
  permission: string,
  signInTarget = "/sign-in",
): Promise<{ user: SessionUser } | { redirectTo: string }> {
  const user = await getSessionUser();
  const decision = await authorization.checkPlatformPermission(user?.id ?? null, permission);
  if (!decision.allowed) {
    return { redirectTo: decision.reason === "unauthenticated" ? signInTarget : "/" };
  }
  return { user: user! };
}
