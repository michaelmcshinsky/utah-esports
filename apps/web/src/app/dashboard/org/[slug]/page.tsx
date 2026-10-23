import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@utah-esports/ui";
import {
  getOrganizationBySlug,
  getMembershipsForUser,
  listOrgEvents,
  eventOccurrences,
  linkChecks,
  organizationMemberships,
  outboundClicks,
  teams,
  userProfiles,
} from "@utah-esports/db";
import { roleHasPermission } from "@utah-esports/core";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";
import { TeamsPanel, type TeamRow } from "@/src/components/teams-panel";
import { MembersPanel, type MemberRow } from "@/src/components/members-panel";

export const metadata: Metadata = { title: "Manage organization" };
export const revalidate = 0;

export default async function OrgDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const { slug } = await params;
  const database = db();
  const org = await getOrganizationBySlug(database, slug);
  if (!org) notFound();
  const memberships = await getMembershipsForUser(database, user.id);
  const membership = memberships.find((m) => m.orgId === org.id);
  const canEdit = membership ? roleHasPermission(membership.role, "events:create") : false;

  if (!membership) {
    return (
      <div className="page-container py-10">
        <h1 className="text-xl font-semibold">{org.name}</h1>
        <p className="mt-2 text-sm text-charcoal-600">
          You&apos;re not a member of this organization. Ask an owner for an invitation, or{" "}
          <Link href="/dashboard" className="text-redrock-600 hover:underline">
            go back
          </Link>
          .
        </p>
      </div>
    );
  }

  const upcoming = await listOrgEvents(database, org.id, 50);

  // Outbound click totals (participation proxies) for this org's events, last 30 days.
  const [clickRow] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(outboundClicks)
    .where(
      sql`${outboundClicks.organizationId} = ${org.id} AND ${outboundClicks.createdAt} >= now() - interval '30 days'`,
    );
  const clickTotal = clickRow?.count ?? 0;
  const perEventClicks = await database
    .select({
      eventId: outboundClicks.eventId,
      title: eventOccurrences.title,
      count: sql<number>`count(*)::int`,
    })
    .from(outboundClicks)
    .leftJoin(eventOccurrences, eq(outboundClicks.eventId, eventOccurrences.id))
    .where(
      sql`${outboundClicks.organizationId} = ${org.id} AND ${outboundClicks.createdAt} >= now() - interval '30 days'`,
    )
    .groupBy(outboundClicks.eventId, eventOccurrences.title)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  // Broken/failing registration links for this org's events.
  const orgEventIds = (
    await database
      .select({ id: eventOccurrences.id })
      .from(eventOccurrences)
      .where(eq(eventOccurrences.organizationId, org.id))
      .limit(300)
  ).map((r) => r.id);
  const brokenLinks =
    orgEventIds.length > 0
      ? await database
          .select()
          .from(linkChecks)
          .where(and(inArray(linkChecks.entityId, orgEventIds), ne(linkChecks.status, "ok")))
          .limit(20)
      : [];

  // Teams + members for the management panels.
  const teamRows = (
    await database.select().from(teams).where(eq(teams.organizationId, org.id)).limit(50)
  ).map(
    (t): TeamRow => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      pathway: t.pathway,
      tryoutInfo: t.tryoutInfo,
      websiteUrl: t.websiteUrl,
      discordRoleId: t.discordRoleId,
      facebookUrl: t.facebookUrl,
      twitterUrl: t.twitterUrl,
      twitchUrl: t.twitchUrl,
      instagramUrl: t.instagramUrl,
      youtubeUrl: t.youtubeUrl,
    }),
  );
  const memberRows: MemberRow[] = (
    await database
      .select({
        membershipId: organizationMemberships.id,
        role: organizationMemberships.role,
        userId: organizationMemberships.userId,
        email: userProfiles.email,
        displayName: userProfiles.displayName,
      })
      .from(organizationMemberships)
      .leftJoin(userProfiles, eq(organizationMemberships.userId, userProfiles.id))
      .where(eq(organizationMemberships.organizationId, org.id))
  ).map((m) => ({
    membershipId: m.membershipId,
    email: m.email ?? "(unknown)",
    displayName: m.displayName,
    role: m.role,
    isSelf: m.userId === user.id,
  }));

  return (
    <div className="page-container py-8">
      <nav className="text-sm text-charcoal-600">
        <Link href="/dashboard" className="hover:text-redrock-600">
          Dashboard
        </Link>{" "}
        / <span>{org.name}</span>
      </nav>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold">{org.name}</h1>
        <Badge variant="accent">{membership.role}</Badge>
        {!org.claimedAt ? <Badge variant="warning">Unclaimed</Badge> : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {canEdit ? (
          <>
            <Link
              href={`/dashboard/org/${org.slug}/events/new`}
              className="rounded-lg bg-redrock-500 px-4 py-2 text-sm font-semibold text-white hover:bg-redrock-600"
            >
              New event
            </Link>
            <Link
              href={`/dashboard/org/${org.slug}/events`}
              className="rounded-lg border border-charcoal-300 px-4 py-2 text-sm font-semibold"
            >
              All events
            </Link>
          </>
        ) : null}
        {!org.claimedAt ? (
          <Link
            href={`/dashboard/org/${org.slug}/claim`}
            className="rounded-lg border border-charcoal-300 px-4 py-2 text-sm font-semibold"
          >
            Claim organization
          </Link>
        ) : null}
        <Link
          href={`/organizations/${org.slug}`}
          className="rounded-lg border border-charcoal-300 px-4 py-2 text-sm font-semibold"
        >
          Public page
        </Link>
        <a
          href={`/api/calendar/org/${org.slug}.ics`}
          className="rounded-lg border border-charcoal-300 px-4 py-2 text-sm font-semibold"
          download
        >
          Calendar feed (.ics)
        </a>
      </div>

      <details className="mt-4 max-w-2xl">
        <summary className="cursor-pointer text-sm font-medium text-charcoal-700">
          Embed this calendar on your site
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-charcoal-200 bg-charcoal-900 p-3 text-xs text-sandstone-100">{`<iframe src="${`https://utahesports.net/embed/calendar/${org.slug}`}" width="100%" height="420" style="border:0" title="${org.name} events"></iframe>`}</pre>
        <p className="mt-1 text-xs text-charcoal-500">
          Updates automatically (refreshed every 5 minutes).
        </p>
      </details>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Discovery interest (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-charcoal-700">
          <p>
            <strong>{clickTotal}</strong> outbound registration/join clicks — a proxy for
            participation, not attendance.
          </p>
          {perEventClicks.length > 0 ? (
            <ul className="mt-3 space-y-1">
              {perEventClicks
                .filter((row) => row.title)
                .map((row) => (
                  <li key={row.eventId ?? row.title} className="flex justify-between gap-4">
                    <span className="truncate">{row.title}</span>
                    <span className="font-medium">{row.count}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="mt-2 text-charcoal-500">No outbound clicks yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Link health</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {brokenLinks.length === 0 ? (
            <p className="text-charcoal-600">
              No failing links detected. Links are checked daily — three consecutive failures
              mark a link broken (listings are never deleted automatically).
            </p>
          ) : (
            <ul className="space-y-2">
              {brokenLinks.map((check) => (
                <li key={check.id} className="rounded-lg border border-charcoal-100 p-3">
                  <p className="flex items-center gap-2">
                    <span
                      className={
                        check.status === "broken"
                          ? "rounded-full bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-600"
                          : "rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-500"
                      }
                    >
                      {check.status}
                    </span>
                    <span className="truncate text-charcoal-700">{check.url}</span>
                  </p>
                  <p className="mt-1 text-xs text-charcoal-500">
                    HTTP {check.httpStatus ?? "—"} · {check.consecutiveFailures} consecutive
                    failures · last check {check.checkedAt?.toLocaleDateString() ?? "never"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Upcoming events ({upcoming.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-charcoal-600">No upcoming events yet.</p>
          ) : (
            <ul className="divide-y divide-charcoal-100">
              {upcoming.map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <div>
                    <Link href={`/events/${event.slug}`} className="font-medium hover:text-redrock-600">
                      {event.title}
                    </Link>
                    <p className="text-charcoal-500">
                      {event.startsAt.toLocaleDateString()} · {event.status}
                    </p>
                  </div>
                  {canEdit ? (
                    <Link
                      href={`/dashboard/org/${org.slug}/events/${event.id}`}
                      className="text-redrock-600 hover:underline"
                    >
                      Edit
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TeamsPanel orgSlug={org.slug} teams={teamRows} canEdit={canEdit} canManage={membership.role === "owner"} />
        <MembersPanel orgSlug={org.slug} members={memberRows} canManage={membership.role === "owner"} />
      </div>
    </div>
  );
}
