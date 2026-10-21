import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@utah-esports/ui";
import { getMembershipsForUser, getOrganizationBySlug, listOrgEvents } from "@utah-esports/db";
import { roleHasPermission } from "@utah-esports/core";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";
import { ConfirmEventButton } from "@/src/components/confirm-event-button";

export const metadata: Metadata = { title: "Org events" };
export const revalidate = 0;

export default async function OrgEventsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const { slug } = await params;
  const database = db();
  const org = await getOrganizationBySlug(database, slug);
  if (!org) notFound();
  const memberships = await getMembershipsForUser(database, user.id);
  const membership = memberships.find((m) => m.orgId === org.id);
  if (!membership || !roleHasPermission(membership.role, "events:edit")) {
    redirect(`/dashboard/org/${slug}`);
  }
  const events = await listOrgEvents(database, org.id, 200);

  return (
    <div className="page-container py-8">
      <nav className="text-sm text-charcoal-600">
        <Link href="/dashboard" className="hover:text-redrock-600">
          Dashboard
        </Link>{" "}
        /{" "}
        <Link href={`/dashboard/org/${slug}`} className="hover:text-redrock-600">
          {org.name}
        </Link>{" "}
        / <span>Events</span>
      </nav>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Events</h1>
        <Link
          href={`/dashboard/org/${slug}/events/new`}
          className="rounded-lg bg-redrock-500 px-4 py-2 text-sm font-semibold text-white"
        >
          New event
        </Link>
      </div>
      <ul className="mt-6 divide-y divide-charcoal-100 rounded-card border border-charcoal-200 bg-white">
        {events.map((event) => (
          <li key={event.id} className="flex items-center justify-between gap-4 p-4 text-sm">
            <div>
              <p className="font-medium text-charcoal-900">{event.title}</p>
              <p className="text-charcoal-500">
                {event.startsAt.toLocaleDateString()} {event.city ? `· ${event.city}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={event.status === "published" ? "success" : "neutral"}>
                {event.status}
              </Badge>
              {event.status === "needs_verification" ? (
                <ConfirmEventButton eventId={event.id} />
              ) : null}
              <Link
                href={`/dashboard/org/${slug}/events/${event.id}`}
                className="text-redrock-600 hover:underline"
              >
                Edit
              </Link>
            </div>
          </li>
        ))}
        {events.length === 0 ? (
          <li className="p-6 text-sm text-charcoal-600">No upcoming events. Create one.</li>
        ) : null}
      </ul>
    </div>
  );
}
