import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, FreshnessBadge } from "@utah-esports/ui";
import { getVenueBySlug } from "@utah-esports/db";
import { db } from "@/src/lib/db";
import { ReportButton } from "@/src/components/report-button";

export const metadata: Metadata = { title: "Place to play" };
export const dynamic = "force-dynamic";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const venue = await getVenueBySlug(db(), slug);
  if (!venue || venue.status === "hidden") notFound();

  return (
    <div className="page-container py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-charcoal-600">
        <Link href="/places" className="hover:text-redrock-600">
          Places to play
        </Link>{" "}
        / <span>{venue.name}</span>
      </nav>
      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <article>
          <h1 className="font-display text-3xl font-bold">{venue.name}</h1>
          {venue.description ? <p className="mt-3 text-charcoal-700">{venue.description}</p> : null}
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            <Info label="Address" value={[venue.address, venue.city, venue.state, venue.postalCode].filter(Boolean).join(", ")} />
            <Info label="Hours" value={venue.hours} />
            <Info label="Equipment" value={venue.equipmentNotes} />
            <Info label="BYOD" value={venue.byodRequired ? "Bring your own device" : null} />
            <Info label="Age policy" value={venue.agePolicy === "unknown" ? null : venue.agePolicy.replace(/_/g, " ")} />
            <Info label="Typical cost" value={venue.typicalCostNotes} />
            <Info label="Accessibility" value={venue.accessibilityNotes} />
          </dl>
        </article>
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {venue.websiteUrl ? (
                <a
                  href={venue.websiteUrl}
                  className="rounded-lg bg-redrock-500 px-4 py-2 text-center font-semibold text-white hover:bg-redrock-600"
                  rel="noopener noreferrer"
                >
                  Visit website →
                </a>
              ) : null}
              {venue.phone ? (
                <a href={`tel:${venue.phone}`} className="rounded-lg border border-charcoal-300 px-4 py-2 text-center font-medium">
                  {venue.phone}
                </a>
              ) : null}
              <ReportButton targetType="venue" targetId={venue.id} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Trust</CardTitle>
            </CardHeader>
            <CardContent>
              <FreshnessBadge lastConfirmedAt={venue.lastConfirmedAt} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="rounded-lg border border-charcoal-200 bg-white p-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-charcoal-500">{label}</dt>
      <dd className="mt-1 text-sm text-charcoal-800">{value}</dd>
    </div>
  );
}
