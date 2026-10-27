import type { ReactNode } from "react";
import { roleHasPermission, type OrgPermission, type OrgRole } from "@utah-esports/core";

/**
 * Declarative access-control gate for React trees (server or client).
 *
 * SECURITY: this layer is UX only. The server enforces every decision at the
 * route/API boundary (`authz-guard.ts`); hiding a button here never *grants*
 * access, it only avoids showing affordances the server would refuse. Never
 * treat client visibility as authorization.
 *
 *   <CanPlatform user={user} permission="platform:moderate">
 *     <ModerationLink />
 *   </CanPlatform>
 */

type GateProps = {
  children: ReactNode;
  /** Rendered when access is denied (default: nothing). */
  fallback?: ReactNode;
};

/** Platform-scope gate driven by the session's effective permissions. */
export function CanPlatform({
  user,
  permission,
  children,
  fallback = null,
}: GateProps & {
  user: { permissions: readonly string[] } | null;
  permission: string;
}) {
  if (!user?.permissions.includes(permission)) return <>{fallback}</>;
  return <>{children}</>;
}

/** Org-scope gate driven by a membership role. */
export function CanOrg({
  role,
  permission,
  children,
  fallback = null,
}: GateProps & {
  role: OrgRole | null | undefined;
  permission: OrgPermission;
}) {
  if (!role || !roleHasPermission(role, permission)) return <>{fallback}</>;
  return <>{children}</>;
}
