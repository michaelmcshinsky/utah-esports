import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, FreshnessBadge, MediaImage } from "@utah-esports/ui";
import {
  getCommunityBySlug,
  getCommunityGames,
  listUpcomingEventsForGames,
} from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { ReportButton } from "@/src/components/report-button";
import { FollowButton } from "@/src/components/follow-button";

export const metadata: Metadata = { title: "Community" };
export const dynamic = "force-dynamic";

export default async function CommunityDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const database = db();
  const community = await getCommunityBySlug(database, slug);
  if (!community || community.status === "hidden") notFound();
  const games = await getCommunityGames(database, community.id);
  const upcoming = await listUpcomingEventsForGames(
    database,
    games.map((g) => g.game.id),
    { city: community.city, limit: 6 },
  );

  return (
    <div className="page-container py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-charcoal-600">
        <Link href="/communities" className="hover:text-redrock-600">
          Communities
        </Link>{" "}
        / <span>{community.name}</span>
      </nav>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <article>
          <h1 className="font-display text-3xl font-bold">{community.name}</h1>
          <MediaImage
            src={null}
            alt={`${community.name} banner`}
            kind="community"
            ratio="wide"
            className="mt-4 rounded-card"
            label={games[0]?.game.name ?? community.name}
            overlayText={
              games.length
                ? `${games
                    .map((g) => g.game.name)
                    .slice(0, 3)
                    .join(" · ")}${community.city ? ` · ${community.city}` : ""}`
                : (community.city ?? "Utah community")
            }
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {games.map((g) => (
              <Link key={g.game.id} href={`/communities?game=${g.game.slug}`}>
                <Badge variant="info">{g.game.name}</Badge>
              </Link>
            ))}
            {community.city ? <Badge variant="neutral">{community.city}</Badge> : null}
          </div>
          {community.welcomeText ? (
            <p className="mt-4 text-charcoal-700">{community.welcomeText}</p>
          ) : community.description ? (
            <p className="mt-4 text-charcoal-700">{community.description}</p>
          ) : (
            <p className="mt-4 text-sm text-charcoal-600">
              This scene doesn&apos;t have a written description yet — treat the join links on this
              page as the front door: introduce yourself, read the pinned rules, and ask where
              newcomers usually start. Don&apos;t see your game? The{" "}
              <Link href="/explore" className="text-redrock-600 hover:underline">
                event explorer
              </Link>{" "}
              lists every game with upcoming Utah events.
            </p>
          )}
          {community.codeOfConductUrl ? (
            <p className="mt-4 text-sm">
              <a href={community.codeOfConductUrl} className="text-redrock-600 hover:underline" rel="noopener noreferrer">
                Code of conduct
              </a>
            </p>
          ) : null}

          <section aria-labelledby="community-events" className="mt-8">
            <h2 id="community-events" className="text-lg font-semibold">
              What&apos;s next for {games[0]?.game.name ?? "this scene"}
            </h2>
            {upcoming.length === 0 ? (
              <EmptyState
                className="mt-3"
                title="No upcoming events yet"
                description="Follow this community to hear when something lands, or browse all events."
                actions={
                  <Link
                    href="/explore"
                    className="rounded-lg bg-charcoal-900 px-4 py-2 text-sm font-medium text-white"
                  >
                    Browse events
                  </Link>
                }
              />
            ) : (
              <ul className="mt-3 space-y-2">
                {upcoming.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={`/events/${event.slug}`}
                      className="flex items-baseline justify-between gap-3 rounded-lg border border-charcoal-200 bg-white px-4 py-3 hover:border-redrock-300"
                    >
                      <span className="font-medium text-charcoal-900">{event.title}</span>
                      <span className="shrink-0 text-sm text-redrock-600">
                        {event.startsAt.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                        {event.city ? ` · ${event.city}` : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {upcoming.length > 0 ? (
              <p className="mt-3 text-sm">
                <Link href="/explore" className="text-redrock-600 hover:underline">
                  See all events →
                </Link>
              </p>
            ) : null}
          </section>
        </article>
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Join</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {community.discordUrl ? (
                <a
                  href={`/api/out/community/${community.id}`}
                  className="rounded-lg bg-redrock-500 px-4 py-2 text-center font-semibold text-white hover:bg-redrock-600"
                >
                  Join on Discord →
                </a>
              ) : null}
              {community.facebookUrl ? (
                <a
                  href={community.facebookUrl}
                  className="rounded-lg border border-charcoal-300 px-4 py-2 text-center font-medium hover:bg-sandstone-50"
                  rel="noopener noreferrer"
                >
                  Facebook group →
                </a>
              ) : null}
              {community.websiteUrl || community.primaryUrl ? (
                <a
                  href={community.websiteUrl ?? community.primaryUrl ?? "#"}
                  className="rounded-lg border border-charcoal-300 px-4 py-2 text-center font-medium hover:bg-sandstone-50"
                  rel="noopener noreferrer"
                >
                  Website →
                </a>
              ) : null}
              {!community.discordUrl && !community.facebookUrl && !community.websiteUrl ? (
                <p className="text-charcoal-600">No public join link listed.</p>
              ) : null}
              <FollowButton kind="community" targetId={community.id} />
              <ReportButton targetType="community" targetId={community.id} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Trust</CardTitle>
            </CardHeader>
            <CardContent>
              <FreshnessBadge lastConfirmedAt={community.lastConfirmedAt} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
