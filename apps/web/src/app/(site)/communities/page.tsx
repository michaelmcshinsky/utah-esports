import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@utah-esports/ui";
import { HeroBanner, SectionTitle } from "@utah-esports/shared";
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
    <>
      {/* Hero band */}
      <HeroBanner variant="band" title="Communities">
        <p className="mt-3 max-w-2xl text-charcoal-200">
          {communities.length} gaming communit{communities.length === 1 ? "y" : "ies"} across
          Utah - Discord servers, Facebook groups, and local scenes by game.{" "}
          <Link href="/events" className="underline hover:text-white">
            Find an event
          </Link>{" "}
          or{" "}
          <Link href="/submit" className="underline hover:text-white">
            submit a community
          </Link>
          .
        </p>
      </HeroBanner>

      {/* Community grid */}
      <section className="section" aria-labelledby="communities-heading">
        <div className="page-container">
          <SectionTitle id="communities-heading">All communities</SectionTitle>
          {game || city ? (
            <p className="mt-2 flex flex-wrap items-center gap-1 text-sm text-charcoal-600">
              Filtered by
              {game ? <span className="badge-gold rounded-full px-2 py-0.5 text-xs">{game}</span> : null}
              {city ? <span className="badge-gold rounded-full px-2 py-0.5 text-xs">{city}</span> : null}
            </p>
          ) : null}
          {communities.length === 0 ? (
            <EmptyState
              className="mt-8"
              title="No communities match"
              description="Try a different game or city — or browse all communities."
              actions={
                <Link href="/communities" className="btn-danger">
                  Show all
                </Link>
              }
            />
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {communities.map(({ community, games }) => (
                <Card key={community.id} className="relative flex flex-col lift">
                  <CardHeader>
                    <CardTitle>
                      <Link
                        href={`/communities/${community.slug}`}
                        className="after:absolute after:inset-0 hover:text-redrock-500"
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
          )}
          <p className="mt-8 text-sm text-charcoal-500">
            Looking to join? Open a community page, read the welcome note and code of conduct, and
            introduce yourself — mention you found them here. Communities marked with a recent check
            badge were confirmed within the last month; older ones may need a nudge.
          </p>
        </div>
      </section>
    </>
  );
}
