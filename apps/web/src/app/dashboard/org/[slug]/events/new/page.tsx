import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getMembershipsForUser, getOrganizationBySlug } from "@utah-esports/db";
import { roleHasPermission } from "@utah-esports/core";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";
import { EventForm } from "@/src/components/event-form";

export const metadata: Metadata = { title: "New event" };
export const revalidate = 0;

export default async function NewEventPage({
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
  if (!membership || !roleHasPermission(membership.role, "events:create")) {
    redirect(`/dashboard/org/${slug}`);
  }

  return (
    <div className="page-container py-8">
      <nav className="text-sm text-charcoal-600">
        <Link href={`/dashboard/org/${slug}`} className="hover:text-redrock-600">
          {org.name}
        </Link>{" "}
        / <span>New event</span>
      </nav>
      <h1 className="mt-3 font-display text-2xl font-bold">New event</h1>
      <EventForm orgSlug={slug} />
    </div>
  );
}
