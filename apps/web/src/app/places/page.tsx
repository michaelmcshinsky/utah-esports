import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardContent, CardHeader, CardTitle, FreshnessBadge } from "@utah-esports/ui";
import { listVenues } from "@utah-esports/db";
import { db } from "@/src/lib/db";

export const metadata: Metadata = {
  title: "Places to play",
  description: "LAN centers, arcades, and venues across Utah where local gaming happens.",
};

export const dynamic = "force-dynamic";

export default async function PlacesPage() {
  const venues = await listVenues(db());
  return (
    <div className="page-container py-8">
      <h1 className="font-display text-3xl font-bold text-charcoal-900">Places to play</h1>
      <p className="mt-2 max-w-2xl text-charcoal-600">
        LAN centers, arcades, and venues that host Utah gaming. Many older listings are marked
        for re-confirmation — check before you drive.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((venue) => (
          <Card key={venue.id} className="relative flex flex-col">
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
    </div>
  );
}
