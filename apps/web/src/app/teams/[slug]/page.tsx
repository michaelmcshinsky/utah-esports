import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  Avatar,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  MediaImage,
} from "@utah-esports/ui";
import {
  getTeamRoster,
  teams,
  organizations,
  getOrganizationBySlug,
} from "@utah-esports/db";
import { db } from "@/src/lib/db";

export const dynamic = "force-dynamic";

const PATHWAY_LABELS: Record<string, string> = {
  collegiate: "Collegiate program",
  high_school: "High school program",
  youth: "Youth program",
  independent_team: "Independent team",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [team] = await db().select().from(teams).where(eq(teams.slug, slug)).limit(1);
  if (!team) return { title: "Team not found" };
  const description =
    team.description?.slice(0, 160) ??
    `${team.name}${team.institution ? ` — ${team.institution}` : ""}${team.city ? ` · ${team.city}` : ""}. Utah ${PATHWAY_LABELS[team.pathway ?? ""] ?? "gaming"} team.`;
  return {
    title: team.name,
    description,
    alternates: { canonical: `/teams/${team.slug}` },
    openGraph: { title: team.name, description },
  };
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const database = db();
  const [team] = await database.select().from(teams).where(eq(teams.slug, slug)).limit(1);
  if (!team || team.status === "hidden") notFound();

  const roster = await getTeamRoster(database, team.id);
  let org = null;
  if (team.organizationId) {
    const [orgRow] = await database
      .select({ slug: organizations.slug })
      .from(organizations)
      .where(eq(organizations.id, team.organizationId))
      .limit(1);
    if (orgRow) org = await getOrganizationBySlug(database, orgRow.slug);
  }

  return (
    <div className="page-container py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-charcoal-600">
        <Link href="/schools" className="hover:text-redrock-600">
          Schools & teams
        </Link>{" "}
        / <span>{team.name}</span>
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <article>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-charcoal-900">{team.name}</h1>
            {team.pathway ? (
              <Badge variant="neutral">{PATHWAY_LABELS[team.pathway] ?? team.pathway}</Badge>
            ) : null}
          </div>

          <MediaImage
            src={team.imageUrl}
            alt={`${team.name} logo`}
            kind="team"
            ratio="wide"
            fit="contain"
            label={team.name}
            className="mt-4 rounded-card"
          />

          {team.description ? (
            <p className="mt-4 text-charcoal-700">{team.description}</p>
          ) : (
            <p className="mt-4 text-sm text-charcoal-600">
              This team hasn&apos;t published a description yet. Reach out through their official
              page or the organization below.
            </p>
          )}

          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {team.institution ? (
              <div className="rounded-lg border border-charcoal-200 bg-white p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-charcoal-500">
                  Institution
                </dt>
                <dd className="mt-1 text-sm text-charcoal-800">{team.institution}</dd>
              </div>
            ) : null}
            {team.city ? (
              <div className="rounded-lg border border-charcoal-200 bg-white p-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-charcoal-500">City</dt>
                <dd className="mt-1 text-sm text-charcoal-800">{team.city}</dd>
              </div>
            ) : null}
          {team.tryoutInfo ? (
            <div className="rounded-lg border border-charcoal-200 bg-white p-3 sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-charcoal-500">
                Tryouts
              </dt>
              <dd className="mt-1 text-sm text-charcoal-800">{team.tryoutInfo}</dd>
            </div>
          ) : null}
          {(team.facebookUrl || team.twitterUrl || team.twitchUrl || team.instagramUrl || team.youtubeUrl) ? (
            <div className="rounded-lg border border-charcoal-200 bg-white p-3 sm:col-span-2">
              <dt className="text-xs font-medium uppercase tracking-wide text-charcoal-500">
                Follow the team
              </dt>
              <dd className="mt-1 flex flex-wrap gap-2 text-sm">
                {[
                  { label: "Facebook", url: team.facebookUrl },
                  { label: "Twitter/X", url: team.twitterUrl },
                  { label: "Twitch", url: team.twitchUrl },
                  { label: "Instagram", url: team.instagramUrl },
                  { label: "YouTube", url: team.youtubeUrl },
                ]
                  .filter((l): l is { label: string; url: string } => Boolean(l.url))
                  .map((l) => (
                    <a
                      key={l.label}
                      href={l.url}
                      rel="noopener noreferrer"
                      className="rounded-lg border border-charcoal-200 px-3 py-1.5 text-xs font-medium text-charcoal-700 hover:border-redrock-300 hover:text-redrock-600"
                    >
                      {l.label} ↗
                    </a>
                  ))}
              </dd>
            </div>
          ) : null}
        </dl>

          <section aria-labelledby="roster-heading" className="mt-8">
            <h2 id="roster-heading" className="text-lg font-semibold">
              Roster
            </h2>
            {roster.length === 0 ? (
              <EmptyState
                className="mt-3"
                title="No public roster yet"
                description="Rosters are maintained by team staff and appear here once published."
              />
            ) : (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {roster.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 rounded-lg border border-charcoal-100 bg-white p-3 text-sm"
                  >
                    <Avatar name={member.displayName} size="sm" decorative />
                    <div>
                      <p className="font-medium text-charcoal-900">{member.displayName}</p>
                      <p className="text-xs text-charcoal-500">{member.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {team.websiteUrl ? (
                <a
                  href={team.websiteUrl}
                  rel="noopener noreferrer"
                  className="rounded-lg bg-redrock-500 px-4 py-2 text-center font-semibold text-white hover:bg-redrock-600"
                >
                  Official page →
                </a>
              ) : null}
              {org ? (
                <Link
                  href={`/organizations/${org.slug}`}
                  className="rounded-lg border border-charcoal-300 px-4 py-2 text-center font-medium hover:bg-sandstone-50"
                >
                  {org.name}
                </Link>
              ) : null}
              <Link
                href="/schools"
                className="rounded-lg border border-charcoal-300 px-4 py-2 text-center font-medium hover:bg-sandstone-50"
              >
                All schools & teams
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
