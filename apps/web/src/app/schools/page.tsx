import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardContent, CardHeader, CardTitle, MediaImage } from "@utah-esports/ui";
import { listTeamsByPathway } from "@utah-esports/db";
import { db } from "@/src/lib/db";

export const metadata: Metadata = {
  title: "Schools & teams",
  description:
    "Scholastic, collegiate, youth, and independent competitive gaming programs across Utah.",
  alternates: { canonical: "/schools" },
};

export const dynamic = "force-dynamic";

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

export default async function SchoolsPage() {
  const database = db();
  const byPathway = await Promise.all(
    PATHWAYS.map(async (p) => ({
      ...p,
      teams: await listTeamsByPathway(database, p.id),
    })),
  );

  return (
    <div className="page-container py-8">
      <h1 className="font-display text-3xl font-bold text-charcoal-900">Schools & teams</h1>
      <p className="mt-2 max-w-2xl text-charcoal-600">
        Utah&apos;s scholastic and collegiate scenes are run by schools and statewide bodies — not
        by this site. We point you to the official programs and contacts, keeping eligibility-
        controlled varsity teams separate from open community clubs.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-charcoal-200 bg-white p-4 text-sm text-charcoal-700">
          <p className="font-medium text-charcoal-900">Official pathways in Utah</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <a href="https://www.uhsaa.org/" className="text-redrock-600 hover:underline" rel="noopener noreferrer">
                UHSAA
              </a>{" "}
              — sanctioned high school state championships
            </li>
            <li>
              <a href="https://www.playvs.com/" className="text-redrock-600 hover:underline" rel="noopener noreferrer">
                PlayVS
              </a>{" "}
              — season-based school leagues used by Utah schools
            </li>
            <li>
              <a href="https://kengarffesports.com/" className="text-redrock-600 hover:underline" rel="noopener noreferrer">
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
        <div className="rounded-card border border-charcoal-200 bg-white p-4 text-sm text-charcoal-700">
          <p className="font-medium text-charcoal-900">Starting a program?</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5">
            <li>Gauge interest — a lunch club needs five people, not fifty.</li>
            <li>Check your school&apos;s club process and advisor requirements.</li>
            <li>Pick one or two games your group already plays.</li>
            <li>
              Publish here:{" "}
              <Link href="/submit" className="text-redrock-600 hover:underline">
                submit an event
              </Link>{" "}
              or a meetup so recruits can find you.
            </li>
          </ol>
        </div>
      </div>

      {byPathway.map((pathway) => (
        <section key={pathway.id} className="mt-10" aria-labelledby={`pathway-${pathway.id}`}>
          <h2 id={`pathway-${pathway.id}`} className="section-heading">
            {pathway.title}
          </h2>
          <p className="mt-1 text-sm text-charcoal-600">{pathway.blurb}</p>
          {pathway.teams.length === 0 ? (
            <p className="mt-3 text-sm text-charcoal-500">
              No verified listings yet — check the official sites above or submit a program.
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {pathway.teams.map((team) => (
                <Card key={team.id} className="relative overflow-hidden">
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
                        href={`/teams/${team.slug}`}
                        className="after:absolute after:inset-0 hover:text-redrock-600"
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
                        className="mt-2 inline-flex min-h-6 items-center text-redrock-600 hover:underline"
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
        </section>
      ))}

      <p className="mt-12 text-sm text-charcoal-600">
        Coach or advisor?{" "}
        <Link href="/submit" className="text-redrock-600 hover:underline">
          Submit your program
        </Link>{" "}
        so players can find it.
      </p>
    </div>
  );
}
