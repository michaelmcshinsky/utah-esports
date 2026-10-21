import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@utah-esports/ui";
import { savedEvents, savedSearches, follows, eventOccurrences } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";
import { SignOutButton } from "@/src/components/sign-out-button";
import { SavedSearchesPanel } from "@/src/components/saved-searches-panel";
import { DiscordLinkPanel } from "@/src/components/discord-link-panel";

export const metadata: Metadata = { title: "Account" };
export const revalidate = 0;

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  const database = db();
  const [saved, searches, followRows] = await Promise.all([
    database
      .select({ saved: savedEvents, event: eventOccurrences })
      .from(savedEvents)
      .leftJoin(eventOccurrences, eq(savedEvents.eventId, eventOccurrences.id))
      .where(eq(savedEvents.userId, user.id))
      .limit(50),
    database.select().from(savedSearches).where(eq(savedSearches.userId, user.id)).limit(50),
    database.select().from(follows).where(eq(follows.userId, user.id)).limit(100),
  ]);

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
            {followRows.length === 0 ? (
              <p className="text-sm text-charcoal-600">
                Follow games, communities, or venues to build your feed.
              </p>
            ) : (
              <p className="text-sm text-charcoal-600">{followRows.length} follows</p>
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
