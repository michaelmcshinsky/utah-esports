import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, CardContent, CardHeader, CardTitle, MediaImage } from "@utah-esports/ui";
import { HeroBanner, SectionTitle } from "@utah-esports/shared";
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
    <>
      {/* Hero band */}
      <HeroBanner variant="band" title="Places to play">
        <p className="mt-3 max-w-2xl text-charcoal-200">
          {venues.length} venue listing{venues.length === 1 ? "" : "s"} across Utah - LAN centers,
          arcades, bar-cades, and university lounges.{" "}
          <Link href="/submit" className="underline hover:text-white">
            Claim a venue
          </Link>{" "}
          to keep details current.
        </p>
      </HeroBanner>

      {/* Venues grid */}
      <section className="section" aria-labelledby="places-heading">
        <div className="page-container">
          <SectionTitle id="places-heading">All places to play</SectionTitle>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {venues.map((venue) => (
              <Card key={venue.id} className="relative flex flex-col overflow-hidden lift">
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
                    <Link href={`/places/${venue.slug}`} className="after:absolute after:inset-0 hover:text-redrock-500">
                      {venue.name}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2 text-sm">
                  {venue.city ? <p className="text-charcoal-600">{venue.city}, UT</p> : null}
                  {venue.typicalCostNotes ? <p>{venue.typicalCostNotes}</p> : null}
                  {venue.byodRequired ? <Badge variant="neutral">Bring your own device</Badge> : null}
                </CardContent>
              </Card>
            ))}
          </div>
          {venues.length === 0 ? (
            <p className="mt-8 text-sm text-charcoal-600">No venues listed yet.</p>
          ) : null}
          <p className="mt-8 text-sm text-charcoal-500">
            Many venue listings came from the old Utah Esports directory and are marked for
            re-confirmation — always check the venue&apos;s own site or call before making the drive.
          </p>
        </div>
      </section>
    </>
  );
}
