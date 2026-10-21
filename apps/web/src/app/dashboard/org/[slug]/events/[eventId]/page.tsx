import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  eventOccurrences,
  getMembershipsForUser,
  getOrganizationBySlug,
} from "@utah-esports/db";
import { roleHasPermission } from "@utah-esports/core";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";
import { EventForm } from "@/src/components/event-form";

export const metadata: Metadata = { title: "Edit event" };
export const revalidate = 0;

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  const { slug, eventId } = await params;
  const database = db();
  const org = await getOrganizationBySlug(database, slug);
  if (!org) notFound();
  const memberships = await getMembershipsForUser(database, user.id);
  const membership = memberships.find((m) => m.orgId === org.id);
  if (!membership || !roleHasPermission(membership.role, "events:edit")) {
    redirect(`/dashboard/org/${slug}`);
  }
  const [event] = await database
    .select()
    .from(eventOccurrences)
    .where(eq(eventOccurrences.id, eventId))
    .limit(1);
  if (!event) notFound();

  return (
    <div className="page-container py-8">
      <nav className="text-sm text-charcoal-600">
        <Link href={`/dashboard/org/${slug}`} className="hover:text-redrock-600">
          {org.name}
        </Link>{" "}
        /{" "}
        <Link href={`/dashboard/org/${slug}/events`} className="hover:text-redrock-600">
          Events
        </Link>{" "}
        / <span>Edit</span>
      </nav>
      <h1 className="mt-3 font-display text-2xl font-bold">{event.title}</h1>
      <EventForm
        orgSlug={slug}
        values={{
          id: event.id,
          title: event.title,
          description: event.description ?? "",
          url: event.registrationUrl ?? "",
          eventType: event.eventType,
          format: event.format,
          startsAt: toLocalInput(event.startsAt),
          endsAt: event.endsAt ? toLocalInput(event.endsAt) : "",
          gameNames: "",
          city: event.city ?? "",
          agePolicy: event.agePolicy,
          skillLevel: event.skillLevel,
          beginnerFriendly: event.beginnerFriendly,
          youthProgram: event.youthProgram,
          priceDollars: event.priceCents != null ? String(event.priceCents / 100) : "",
          registrationState: event.registrationState,
          registrationDeadline: event.registrationDeadline
            ? toLocalInput(event.registrationDeadline)
            : "",
          contactName: event.contactName ?? "",
          contactEmail: event.contactEmail ?? "",
          status: event.status,
        }}
      />
    </div>
  );
}

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
