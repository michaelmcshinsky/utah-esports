import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import {
  changeRecords,
  eventOccurrences,
  getMembershipsForUser,
  getOrganizationBySlug,
} from "@utah-esports/db";
import { roleHasPermission } from "@utah-esports/core";
import { db } from "@/src/lib/db";
import { getSessionUser } from "@/src/lib/session";
import { EventForm } from "@/src/components/event-form";
import type { EventFormValues } from "@/src/lib/forms/schemas";

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

  const history = await database
    .select()
    .from(changeRecords)
    .where(eq(changeRecords.entityId, eventId))
    .orderBy(desc(changeRecords.createdAt))
    .limit(20);

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
          status: event.status as EventFormValues["status"],
        }}
      />

      <section aria-labelledby="history-heading" className="mt-10 max-w-2xl">
        <h2 id="history-heading" className="text-lg font-semibold">
          Change history
        </h2>
        <p className="mt-1 text-sm text-charcoal-600">
          Every edit is audited; followers are notified of material changes.
        </p>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-charcoal-500">No recorded changes yet.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {history.map((change) => (
              <li key={change.id} className="rounded-lg border border-charcoal-100 bg-white p-3 text-sm">
                <p className="font-medium text-charcoal-800">
                  {change.field} changed
                  <span className="ml-2 text-xs font-normal text-charcoal-500">
                    {change.actor} · {change.createdAt.toLocaleString()}
                  </span>
                </p>
                <p className="mt-1 break-words text-xs text-charcoal-600">
                  <span className="line-through opacity-70">{change.oldValue || "—"}</span>
                  {" → "}
                  <span className="font-medium">{change.newValue || "—"}</span>
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
