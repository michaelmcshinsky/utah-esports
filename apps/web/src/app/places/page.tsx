import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardContent, CardHeader, CardTitle, FreshnessBadge, MediaImage } from "@utah-esports/ui";
import { listVenues } from "@utah-esports/db";
import { db } from "@/src/lib/db";

export const metadata: Metadata = {
  title: "Places to play",
  description: "LAN centers, arcades, and venues across Utah where local gaming happens.",
  alternates: { canonical: "/places" },
};

export const dynamic = "force-dynamic";

export default async function PlacesPage() {
  const venues = await listVenues(db());
  return (
    <div className="page-container py-8">
      <h1 className="font-display text-3xl font-bold text-charcoal-900">Places to play</h1>
      <p className="mt-2 max-w-2xl text-charcoal-600">
        Utah&apos;s gaming happens in real rooms — LAN centers in West Valley, arcades downtown,
        bar-cades in Ogden, and university lounges from Logan to St. George. A venue listing here
        tells you what to expect before you go: hours, gear, age rules, and what a night typically
        costs.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-charcoal-500">
        Many venue listings came from the old Utah Esports directory and are marked for
        re-confirmation — always check the venue&apos;s own site or call before making the drive.
        Run a venue? Claim it to keep details current.
      </p>
      <h2 className="sr-only">All places to play</h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue) => (
          <Card key={venue.id} className="relative flex flex-col overflow-hidden">
            <MediaImage
              src={venue.imageUrl}
              alt={`${venue.name}`}
              kind="venue"
              ratio="video"
              label={venue.city ?? venue.name}
              overlayText={venue.imageUrl ? undefined : (venue.city ?? "Utah venue")}
            />
            <CardHeader>
              <CardTitle>
                <Link href={`/places/${venue.slug}`} className="after:absolute after:inset-0">
                  {venue.name}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-2 text-sm">
              {venue.city ? <p className="text-charcoal-600">{venue.city}, UT</p> : null}
              {venue.typicalCostNotes ? <p>{venue.typicalCostNotes}</p> : null}
              {venue.byodRequired ? <Badge variant="neutral">Bring your own device</Badge> : null}
              <FreshnessBadge className="mt-auto pt-2" lastConfirmedAt={venue.lastConfirmedAt} />
            </CardContent>
          </Card>
        ))}
      </div>
      {venues.length === 0 ? (
        <p className="mt-8 text-sm text-charcoal-600">No venues listed yet.</p>
      ) : null}
    </div>
  );
}
