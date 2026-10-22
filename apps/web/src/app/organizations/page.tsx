import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardContent, CardHeader } from "@utah-esports/ui";
import { listOrganizations, listOrgEvents } from "@utah-esports/db";
import { db } from "@/src/lib/db";

export const metadata: Metadata = {
  alternates: { canonical: "/organizations" },
  title: "Organizations",
  description: "Utah gaming organizations — communities, organizers, venues, and scholastic programs.",
};

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

export default async function OrganizationsIndexPage() {
  const database = db();
  const orgs = await listOrganizations(database);
  const withCounts = await Promise.all(
    orgs.map(async (org) => ({
      org,
      upcoming: (await listOrgEvents(database, org.id, 50)).length,
    })),
  );

  return (
    <div className="page-container py-8">
      <h1 className="font-display text-3xl font-bold text-charcoal-900">Organizations</h1>
      <p className="mt-2 max-w-2xl text-sm text-charcoal-600">
        Communities, organizers, venues, and programs that maintain listings here. Claimed
        ownership means a moderator verified affiliation — not a safety endorsement.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {withCounts.map(({ org, upcoming }) => (
          <Card key={org.id} className="relative">
            <CardHeader>
              <Link
                href={`/organizations/${org.slug}`}
                className="text-base font-semibold text-charcoal-900 after:absolute after:inset-0 hover:text-redrock-600"
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
        <p className="mt-8 text-sm text-charcoal-600">No organizations yet — create one from the dashboard.</p>
      ) : null}
    </div>
  );
}
