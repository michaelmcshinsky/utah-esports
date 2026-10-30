import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@utah-esports/ui";
import { organizations, organizationMemberships } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";
import { CreateOrganizationForm } from "@/src/components/create-organization-form";

export const revalidate = 0;

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const database = db();

  const memberships = await database
    .select({ membership: organizationMemberships, org: organizations })
    .from(organizationMemberships)
    .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
    .where(eq(organizationMemberships.userId, user.id));

  return (
    <div className="page-container py-8">
      <h1 className="font-display text-3xl font-bold">Organizer dashboard</h1>
      <p className="mt-1 text-sm text-charcoal-600">
        Manage events for organizations you belong to — or create one and claim it.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          {memberships.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-charcoal-600">
                You&apos;re not a member of any organization yet. Create one below, or ask an
                owner to add you.
              </CardContent>
            </Card>
          ) : (
            memberships.map(({ membership, org }) => (
              <Card key={org.id}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle>{org.name}</CardTitle>
                  <Badge variant="accent">{membership.role}</Badge>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 text-sm">
                  <Link
                    href={`/dashboard/org/${org.slug}`}
                    className="rounded-lg bg-charcoal-900 px-3 py-1.5 font-medium text-white"
                  >
                    Manage
                  </Link>
                  <Link
                    href={`/dashboard/org/${org.slug}/events`}
                    className="rounded-lg border border-charcoal-300 px-3 py-1.5 font-medium"
                  >
                    Events
                  </Link>
                  <Link
                    href={`/dashboard/org/${org.slug}/events/new`}
                    className="rounded-lg border border-charcoal-300 px-3 py-1.5 font-medium"
                  >
                    New event
                  </Link>
                  {!org.claimedAt ? (
                    <Badge variant="warning">Unclaimed — submit proof</Badge>
                  ) : null}
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <div>
          <CreateOrganizationForm />
        </div>
      </div>
    </div>
  );
}
