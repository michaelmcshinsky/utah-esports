import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@utah-esports/ui";
import {
  savedEvents,
  savedSearches,
  follows,
  eventFollows,
  eventOccurrences,
  communities,
  venues,
  games,
  organizations,
} from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";
import { SignOutButton } from "@/src/components/sign-out-button";
import { SavedSearchesPanel } from "@/src/components/saved-searches-panel";
import { DiscordLinkPanel } from "@/src/components/discord-link-panel";
import { UnfollowButton } from "@/src/components/unfollow-button";

export const metadata: Metadata = { title: "Account" };
export const revalidate = 0;

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const database = db();
  const [saved, searches, followRows, eventFollowRows] = await Promise.all([
    database
      .select({ saved: savedEvents, event: eventOccurrences })
      .from(savedEvents)
      .leftJoin(eventOccurrences, eq(savedEvents.eventId, eventOccurrences.id))
      .where(eq(savedEvents.userId, user.id))
      .limit(50),
    database.select().from(savedSearches).where(eq(savedSearches.userId, user.id)).limit(50),
    database.select().from(follows).where(eq(follows.userId, user.id)).limit(100),
    database
      .select({ follow: eventFollows, event: eventOccurrences })
      .from(eventFollows)
      .leftJoin(eventOccurrences, eq(eventFollows.eventId, eventOccurrences.id))
      .where(eq(eventFollows.userId, user.id))
      .limit(50),
  ]);

  const followTargets = await loadFollowTargets(followRows);

  return (
    <div className="page-container py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Your account</h1>
          <p className="mt-1 text-sm text-charcoal-600">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Saved events</CardTitle>
          </CardHeader>
          <CardContent>
            {saved.length === 0 ? (
              <p className="text-sm text-charcoal-600">
                Nothing saved yet — hit “Save event” on any listing.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {saved.map(({ event }) =>
                  event ? (
                    <li key={event.id}>
                      <Link href={`/events/${event.slug}`} className="text-redrock-600 hover:underline">
                        {event.title}
                      </Link>{" "}
                      <span className="text-charcoal-500">
                        · {event.startsAt.toLocaleDateString()}
                      </span>
                    </li>
                  ) : null,
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        <SavedSearchesPanel
          searches={searches.map((s) => ({
            id: s.id,
            name: s.name,
            query: s.query,
            notify: s.notify,
          }))}
        />

        <Card>
          <CardHeader>
            <CardTitle>Following</CardTitle>
          </CardHeader>
          <CardContent>
            {followRows.length === 0 && eventFollowRows.length === 0 ? (
              <p className="text-sm text-charcoal-600">
                Follow games, communities, events, or venues to build your feed and get change
                notifications.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {eventFollowRows.map(({ event }) =>
                  event ? (
                    <li key={`e-${event.id}`} className="flex items-center justify-between gap-2">
                      <Link href={`/events/${event.slug}`} className="text-redrock-600 hover:underline">
                        {event.title}
                      </Link>
                      <UnfollowButton kind="event" targetId={event.id} />
                    </li>
                  ) : null,
                )}
                {followRows.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <Badge variant="neutral">{f.kind}</Badge>
                      <span className="text-charcoal-700">
                        {followTargets.get(`${f.kind}:${f.targetId}`) ?? "saved item"}
                      </span>
                    </span>
                    <UnfollowButton kind={f.kind} targetId={f.targetId} />
                  </li>
                ))}
              </ul>
            )}
            <Link href="/account/preferences" className="mt-3 inline-block text-sm font-medium text-redrock-600 hover:underline">
              Edit preferences →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-charcoal-600">
              Manage events for orgs you belong to.
            </p>
            <Link
              href="/dashboard"
              className="mt-3 inline-block rounded-lg bg-charcoal-900 px-4 py-2 text-sm font-medium text-white"
            >
              Open dashboard
            </Link>
          </CardContent>
        </Card>

        <DiscordLinkPanel />
      </div>
    </div>
  );
}

/** Resolve follow targets to display names for the account list. */
async function loadFollowTargets(
  rows: Array<{ kind: string; targetId: string }>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const database = db();
  const byKind = new Map<string, string[]>();
  for (const row of rows) {
    const ids = byKind.get(row.kind) ?? [];
    ids.push(row.targetId);
    byKind.set(row.kind, ids);
  }
  for (const [kind, ids] of byKind) {
    if (ids.length === 0) continue;
    if (kind === "game") {
      const found = await database.select().from(games).where(inArray(games.id, ids));
      for (const g of found) map.set(`game:${g.id}`, g.name);
    } else if (kind === "community") {
      const found = await database.select().from(communities).where(inArray(communities.id, ids));
      for (const c of found) map.set(`community:${c.id}`, c.name);
    } else if (kind === "venue") {
      const found = await database.select().from(venues).where(inArray(venues.id, ids));
      for (const v of found) map.set(`venue:${v.id}`, v.name);
    } else if (kind === "organization") {
      const found = await database
        .select()
        .from(organizations)
        .where(inArray(organizations.id, ids));
      for (const o of found) map.set(`organization:${o.id}`, o.name);
    }
  }
  return map;
}
