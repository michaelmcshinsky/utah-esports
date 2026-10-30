import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardContent, CardHeader } from "@utah-esports/ui";
import { HeroBanner, SectionTitle } from "@utah-esports/shared";
import { listOrganizations, listOrgEvents } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getStateConfig } from "@/src/lib/states/registry";

export const dynamic = "force-dynamic";

const KIND_LABELS: Record<string, string> = {
  community: "Community",
  organizer: "Event organizer",
  venue: "Venue",
  team: "Team",
  school: "School",
  collegiate: "Collegiate",
  youth: "Youth",
  other: "Other",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const config = getStateConfig(state);
  const name = config?.name ?? state;
  return {
    title: "Organizations",
    description: `${name} gaming organizations — communities, organizers, venues, and scholastic programs.`,
    alternates: { canonical: `/${config?.slug ?? state}/organizations` },
  };
}

export default async function StateOrganizationsIndexPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const config = getStateConfig(state);
  const name = config?.name ?? state;
  const database = db();
  const orgs = await listOrganizations(database);
  const withCounts = await Promise.all(
    orgs.map(async (org) => ({
      org,
      upcoming: (await listOrgEvents(database, org.id, 50)).length,
    })),
  );

  return (
    <>
      <HeroBanner variant="band" title="Organizations">
        <p className="mt-3 max-w-2xl text-charcoal-200">
          {withCounts.length} organization{withCounts.length === 1 ? "" : "s"} across {name} -
          communities, organizers, venues, and scholastic programs.
        </p>
      </HeroBanner>

      <section className="section" aria-labelledby="orgs-heading">
        <div className="page-container">
          <SectionTitle id="orgs-heading">All organizations</SectionTitle>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {withCounts.map(({ org, upcoming }) => (
              <Card key={org.id} className="relative lift">
                <CardHeader>
                  <Link
                    href={`/organizations/${org.slug}`}
                    className="text-base font-semibold text-charcoal-900 after:absolute after:inset-0 hover:text-redrock-500"
                  >
                    {org.name}
                  </Link>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="neutral">{KIND_LABELS[org.kind] ?? org.kind}</Badge>
                    {org.claimedAt ? <Badge variant="success">Claimed</Badge> : null}
                    {upcoming > 0 ? <Badge variant="accent">{upcoming} upcoming</Badge> : null}
                  </div>
                  {org.city ? <p className="mt-2 text-charcoal-600">{org.city}</p> : null}
                </CardContent>
              </Card>
            ))}
          </div>
          {withCounts.length === 0 ? (
            <p className="mt-8 text-sm text-charcoal-600">
              No organizations yet — create one from the dashboard.
            </p>
          ) : null}
          <p className="mt-8 text-sm text-charcoal-500">
            Claimed ownership means a moderator verified affiliation — not a safety endorsement.
          </p>
        </div>
      </section>
    </>
  );
}
