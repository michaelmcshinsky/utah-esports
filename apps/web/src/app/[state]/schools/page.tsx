import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardContent, CardHeader, CardTitle, MediaImage } from "@utah-esports/ui";
import { HeroBanner, SectionTitle } from "@utah-esports/shared";
import { listTeamsByPathway } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getStateConfig } from "@/src/lib/states/registry";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const config = getStateConfig(state);
  if (!config) return { title: "Not found" };
  return {
    title: "Schools & teams",
    description: `Scholastic, collegiate, youth, and independent competitive gaming programs across ${config.name}.`,
    alternates: { canonical: `/${config.slug}/schools` },
  };
}

const PATHWAYS = [
  {
    id: "collegiate",
    title: "Collegiate programs",
    blurb: "Official university varsity and club programs. Eligibility is set by each school.",
  },
  {
    id: "high_school",
    title: "High school programs",
    blurb: "School-sanctioned clubs and teams. UHSAA governs scholastic championships.",
  },
  {
    id: "youth",
    title: "Youth programs",
    blurb: "Organized play for younger students — adult-supervised, official contacts only.",
  },
  {
    id: "independent_team",
    title: "Independent teams",
    blurb: "Community competitive teams and orgs open to the public. Tryout info varies.",
  },
] as const;

export default async function StateSchoolsPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const config = getStateConfig(state);
  const database = db();
  const byPathway = await Promise.all(
    PATHWAYS.map(async (p) => ({
      ...p,
      teams: await listTeamsByPathway(database, p.id),
    })),
  );
  const teamCount = byPathway.reduce((n, p) => n + p.teams.length, 0);

  return (
    <>
      {/* Hero band */}
      <HeroBanner title="Schools & teams" backgroundImage={config?.heroImage}>
        <p className="mt-3 max-w-2xl text-charcoal-200">
          {teamCount} verified program{teamCount === 1 ? "" : "s"} across {config?.name} —
          scholastic, collegiate, youth, and independent teams.{" "}
          <Link href={`/${config?.slug}/submit`} className="underline hover:text-white">
            Submit a program
          </Link>
          .
        </p>
      </HeroBanner>

      {/* Info cards */}
      <section className="section section-light" aria-labelledby="pathways-heading">
        <div className="page-container">
          <SectionTitle id="pathways-heading">Official pathways</SectionTitle>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-charcoal-200 bg-white p-6 lift">
              <p className="font-medium text-charcoal-900">Official pathways in {config?.name}</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-charcoal-700">
                <li>
                  <a
                    href="https://www.uhsaa.org/"
                    className="text-redrock-500 hover:text-redrock-600"
                    rel="noopener noreferrer"
                  >
                    UHSAA
                  </a>{" "}
                  — sanctioned high school state championships
                </li>
                <li>
                  <a
                    href="https://www.playvs.com/"
                    className="text-redrock-500 hover:text-redrock-600"
                    rel="noopener noreferrer"
                  >
                    PlayVS
                  </a>{" "}
                  — season-based school leagues used by {config?.name} schools
                </li>
                <li>
                  <a
                    href="https://kengarffesports.com/"
                    className="text-redrock-500 hover:text-redrock-600"
                    rel="noopener noreferrer"
                  >
                    Ken Garff Esports
                  </a>{" "}
                  — school-oriented programming and events
                </li>
                <li>
                  University programs (UVU, U of U, BYU, USU, Weber) set their own eligibility —
                  contact each school directly.
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-charcoal-200 bg-white p-6 lift">
              <p className="font-medium text-charcoal-900">Starting a program?</p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-charcoal-700">
                <li>Gauge interest — a lunch club needs five people, not fifty.</li>
                <li>Check your school&apos;s club process and advisor requirements.</li>
                <li>Pick one or two games your group already plays.</li>
                <li>
                  Publish here:{" "}
                  <Link
                    href={`/${config?.slug}/submit`}
                    className="text-redrock-500 hover:text-redrock-600"
                  >
                    submit an event
                  </Link>{" "}
                  or a meetup so recruits can find you.
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Pathway sections */}
      <section className="section" aria-labelledby="pathways-list">
        <div className="page-container">
          <SectionTitle id="pathways-list">Programs by pathway</SectionTitle>
          {byPathway.map((pathway) => (
            <div key={pathway.id} className="mt-8">
              <h3 className="font-display text-xl font-semibold text-charcoal-900">{pathway.title}</h3>
              <p className="mt-1 text-sm text-charcoal-600">{pathway.blurb}</p>
              {pathway.teams.length === 0 ? (
                <p className="mt-3 text-sm text-charcoal-500">
                  No verified listings yet — check the official sites above or submit a program.
                </p>
              ) : (
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  {pathway.teams.map((team) => (
                    <Card key={team.id} className="relative overflow-hidden lift">
                      <MediaImage
                        src={team.imageUrl}
                        alt={`${team.name} logo`}
                        kind="team"
                        ratio="wide"
                        fit="contain"
                        label={team.name}
                        overlayText={team.imageUrl ? undefined : undefined}
                      />
                      <CardHeader>
                        <CardTitle>
                          <Link
                            href={`/${config?.slug}/teams/${team.slug}`}
                            className="after:absolute after:inset-0 hover:text-redrock-500"
                          >
                            {team.name}
                          </Link>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        {team.institution && team.name.toLowerCase() !== team.institution.toLowerCase() ? (
                          <p className="text-charcoal-600">{team.institution}</p>
                        ) : null}
                        {team.city ? <Badge className="mt-1">{team.city}</Badge> : null}
                        {team.tryoutInfo ? (
                          <p className="mt-2 rounded-lg bg-sandstone-100 px-2 py-1.5 text-xs text-charcoal-700">
                            <span className="font-semibold">Tryouts:</span> {team.tryoutInfo}
                          </p>
                        ) : null}
                        {team.websiteUrl ? (
                          <a
                            href={team.websiteUrl}
                            className="mt-2 inline-flex min-h-6 items-center text-redrock-500 hover:text-redrock-600"
                            rel="noopener noreferrer"
                          >
                            Official page →
                          </a>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="mt-10 rounded-xl border border-charcoal-200 bg-white px-6 py-6 lift">
            <p className="text-sm text-charcoal-600">
              Coach or advisor?{" "}
              <Link href={`/${config?.slug}/submit`} className="text-redrock-500 hover:text-redrock-600">
                Submit your program
              </Link>{" "}
              so players can find it.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
