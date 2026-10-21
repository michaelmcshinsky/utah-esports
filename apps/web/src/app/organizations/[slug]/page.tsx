import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, FreshnessBadge } from "@utah-esports/ui";
import {
  getOrganizationBySlug,
  listOrgEvents,
  getEventGames,
  getMembershipsForUser,
  teams,
} from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";
import { FollowButton } from "@/src/components/follow-button";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Organization" };
export const dynamic = "force-dynamic";

export default async function OrganizationPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const database = db();
  const org = await getOrganizationBySlug(database, slug);
  if (!org || org.status !== "active") notFound();

  const user = await getSessionUser();
  const isMember = user
    ? (await getMembershipsForUser(database, user.id)).some((m) => m.orgId === org.id)
    : false;

  const [upcoming, orgTeams] = await Promise.all([
    listOrgEvents(database, org.id, 12),
    database.select().from(teams).where(eq(teams.organizationId, org.id)).limit(20),
  ]);

  const relatedEvents = upcoming.length
    ? await Promise.all(
        upcoming.map(async (e) => ({
          event: e,
          games: (await getEventGames(database, e.id)).map((g) => g.game.name),
        })),
      )
    : [];

  const hasCalendar = upcoming.length > 0;

  return (
    <div className="page-container py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-charcoal-600">
        <Link href="/organizations" className="hover:text-redrock-600">
          Organizations
        </Link>{" "}
        / <span>{org.name}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold text-charcoal-900">{org.name}</h1>
        <Badge variant="neutral">{org.kind}</Badge>
        {org.claimedAt ? (
          <Badge variant="success" title="Ownership verified by a moderator">
            Claimed
          </Badge>
        ) : (
          <Badge variant="warning">Unconfirmed ownership</Badge>
        )}
      </div>
      {org.description ? (
        <p className="mt-3 max-w-2xl text-charcoal-700">{org.description}</p>
      ) : (
        <p className="mt-3 text-sm text-charcoal-600">
          No description yet — the organization maintains this listing.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <FollowButton kind="organization" targetId={org.id} />
        {hasCalendar ? (
          <a
            href={`/api/calendar/org/${org.slug}.ics`}
            download
            className="rounded-lg border border-charcoal-300 px-4 py-2 text-sm font-medium hover:bg-sandstone-50"
          >
            Subscribe (.ics)
          </a>
        ) : null}
        {org.websiteUrl ? (
          <a
            href={org.websiteUrl}
            rel="noopener noreferrer"
            className="rounded-lg border border-charcoal-300 px-4 py-2 text-sm font-medium hover:bg-sandstone-50"
          >
            Website ↗
          </a>
        ) : null}
        {isMember ? (
          <Link
            href={`/dashboard/org/${org.slug}`}
            className="rounded-lg bg-charcoal-900 px-4 py-2 text-sm font-medium text-white"
          >
            Manage
          </Link>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section aria-labelledby="org-events">
          <h2 id="org-events" className="section-heading">
            Upcoming events
          </h2>
          {relatedEvents.length === 0 ? (
            <EmptyState
              className="mt-4"
              title="No upcoming events listed"
              description="Follow this organization to hear when something new is announced."
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {relatedEvents.map(({ event, games }) => (
                <li key={event.id}>
                  <Link
                    href={`/events/${event.slug}`}
                    className="block rounded-card border border-charcoal-200 bg-white p-4 hover:border-redrock-300"
                  >
                    <p className="font-medium text-charcoal-900">{event.title}</p>
                    <p className="mt-1 text-sm text-redrock-600">
                      {event.startsAt.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      {event.format === "online" ? "Online" : (event.city ?? "Utah")}
                    </p>
                    {games.length ? (
                      <p className="mt-1 text-xs text-charcoal-500">{games.join(", ")}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teams & programs</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {orgTeams.length === 0 ? (
                <p className="text-charcoal-600">No public teams listed.</p>
              ) : (
                <ul className="space-y-1.5">
                  {orgTeams.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2">
                      <span>{t.name}</span>
                      {t.pathway ? <Badge variant="neutral">{t.pathway}</Badge> : null}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3">
                <Link href="/schools" className="text-redrock-600 hover:underline">
                  All schools & teams →
                </Link>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trust</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <FreshnessBadge lastConfirmedAt={org.claimedAt ?? org.updatedAt} />
              <p className="text-xs text-charcoal-500">
                “Claimed” means ownership was checked — not a safety or quality endorsement.
              </p>
              {org.contactEmail ? (
                <p className="text-xs text-charcoal-500">
                  Contact: <a href={`mailto:${org.contactEmail}`} className="underline">{org.contactEmail}</a>
                </p>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
