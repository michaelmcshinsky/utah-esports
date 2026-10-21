import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, CardContent, CardHeader, CardTitle, FreshnessBadge } from "@utah-esports/ui";
import { getCommunityBySlug, getCommunityGames } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { ReportButton } from "@/src/components/report-button";

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
          <div className="mt-2 flex flex-wrap gap-1.5">
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
              This community hasn&apos;t published a description yet.
            </p>
          )}
          {community.codeOfConductUrl ? (
            <p className="mt-4 text-sm">
              <a href={community.codeOfConductUrl} className="text-redrock-600 hover:underline" rel="noopener noreferrer">
                Code of conduct
              </a>
            </p>
          ) : null}
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
