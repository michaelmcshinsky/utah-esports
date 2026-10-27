import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@utah-esports/ui";
import { getCommunityGames, listCommunities } from "@utah-esports/db";
import { db } from "@/src/lib/db";

export const metadata: Metadata = {
  alternates: { canonical: "/communities" },
  title: "Communities",
  description: "Gaming communities across Utah — Discord servers, Facebook groups, and local scenes by game.",
};

export const dynamic = "force-dynamic";

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string; city?: string }>;
}) {
  const { game, city } = await searchParams;
  const database = db();
  const communityRows = await listCommunities(database, { gameSlug: game, city });
  const communities = await Promise.all(
    communityRows.map(async (community) => ({
      community,
      games: await getCommunityGames(database, community.id),
    })),
  );

  return (
    <div className="page-container py-8">
      <h1 className="font-display text-3xl font-bold text-charcoal-900">Communities</h1>
      <p className="mt-2 max-w-2xl text-charcoal-600">
        Where Utah&apos;s players gather between events — Discord servers, Facebook groups, and
        long-running scenes organized by game. Discord is a destination, not a prerequisite: the
        basics (who they are, what they play, when they meet) are always on this site. Filters:{" "}
        {game ? <Badge variant="accent">{game}</Badge> : null}{" "}
        {city ? <Badge variant="accent">{city}</Badge> : null}
      </p>
      <p className="mt-2 max-w-2xl text-sm text-charcoal-500">
        Looking to join? Open a community page, read the welcome note and code of conduct, and
        introduce yourself — mention you found them here. Communities marked with a recent check
        badge were confirmed within the last month; older ones may need a nudge.
      </p>

      {communities.length === 0 ? (
        <EmptyState
          className="mt-8"
          title="No communities match"
          description="Try a different game or city — or browse all communities."
          actions={
            <Link
              href="/communities"
              className="rounded-lg bg-charcoal-900 px-4 py-2 text-sm font-medium text-white"
            >
              Show all
            </Link>
          }
        />
      ) : (
        <>
          <h2 className="sr-only">All communities</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map(({ community, games }) => (
            <Card key={community.id} className="relative flex flex-col">
              <CardHeader>
                <CardTitle>
                  <Link
                    href={`/communities/${community.slug}`}
                    className="after:absolute after:inset-0"
                  >
                    {community.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap gap-1">
                  {games.slice(0, 3).map((g) => (
                    <Badge key={g.game.id} variant="info">
                      {g.game.name}
                    </Badge>
                  ))}
                </div>
                {community.city ? (
                  <p className="text-sm text-charcoal-600">{community.city}</p>
                ) : null}
                {community.description ? (
                  <p className="line-clamp-3 text-sm text-charcoal-700">{community.description}</p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
