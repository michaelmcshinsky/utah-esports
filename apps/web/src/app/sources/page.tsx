import type { Metadata } from "next";
import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { Badge } from "@utah-esports/ui";
import { catalogSources, venues } from "@utah-esports/db";
import { KIND_LABELS, KIND_BLURBS, type SourceKind } from "@utah-esports/scrapers";
import { db } from "@/src/lib/db";

export const metadata: Metadata = {
  title: "Sources",
  description:
    "Every Utah gaming site Utah Esports tracks — event platforms, venues, conventions, scholastic bodies, organizers, and community hubs — with how each one is (or isn't) scraped.",
  alternates: { canonical: "/sources" },
};

export const dynamic = "force-dynamic";

// Freshness badges compare against module-load time (server boot); a day or
// two of drift is irrelevant for a "checked recently" label.
const PAGE_LOAD_TIME_MS = Date.now();

const KIND_ORDER: SourceKind[] = [
  "event_platform",
  "venue",
  "convention",
  "scholastic",
  "organizer",
  "community_hub",
  "media",
];

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  active: "success",
  unknown: "warning",
  defunct: "danger",
  archived: "neutral",
};

const ADAPTER_LABELS: Record<string, string> = {
  "startgg-url": "start.gg API",
  "legacy-jekyll": "Archive parser",
  "generic-event": "URL scrape",
  none: "Manual / organizer-run",
};

export default async function SourcesPage() {
  const database = db();
  const rows = await database
    .select()
    .from(catalogSources)
    .where(inArray(catalogSources.status, ["active", "unknown", "defunct", "archived"]))
    .orderBy(desc(catalogSources.name));

  // Cross-link catalog venues to their directory pages (same-slug match).
  const venueRows = await database.select({ slug: venues.slug }).from(venues);
  const venueSlugs = new Set(venueRows.map((v) => v.slug));

  const byKind = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byKind.get(row.kind) ?? [];
    list.push(row);
    byKind.set(row.kind, list);
  }
  const verifiedWithinDays = (date: Date | null): boolean => {
    if (!date) return false;
    return PAGE_LOAD_TIME_MS - date.getTime() < 60 * 24 * 60 * 60 * 1000;
  };

  return (
    <>
      {/* Hero banner */}
      <div
        className="hero-section text-white"
        style={{
          backgroundImage: "url('/images/home/utah-esports-banner-2.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="page-container py-14">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Sources we track</h1>
          <p className="mt-3 max-w-2xl text-charcoal-200">
            Utah Esports is only as fresh as its sources. This is every site we know about that
            carries Utah gaming events, teams, or communities — what it is, whether it&apos;s still
            alive, and exactly how it gets imported. Public event pages are scraped conservatively;
            private groups are <strong>never</strong> crawled — organizers can claim their org and
            publish directly instead.
          </p>
          <p className="mt-2 max-w-2xl text-sm text-charcoal-300">
            Maintainers: the typed catalog lives in{" "}
            <code className="rounded bg-charcoal-800 px-1.5 py-0.5 text-xs">packages/scrapers/src/catalog/utah-sources.ts</code>{" "}
            (seeded into this page) — see the repository&apos;s{" "}
            <code className="rounded bg-charcoal-800 px-1.5 py-0.5 text-xs">docs/SCRAPING.md</code>{" "}
            for adapter how-tos and the batch-import CLI.{" "}
            <Link href="/organizers" className="text-gold-400 hover:text-gold-200">
              Run one of these orgs? Claim it →
            </Link>
          </p>
        </div>
      </div>

      {/* Source catalog */}
      <section className="section" aria-labelledby="sources-heading">
        <div className="page-container">
          {KIND_ORDER.filter((kind) => byKind.has(kind)).map((kind) => {
            const entries = byKind.get(kind) ?? [];
            return (
              <div key={kind} className="mb-10">
                <h2 id={`kind-${kind}`} className="section-title">
                  {KIND_LABELS[kind]}{" "}
                  <span className="ml-2 text-base font-normal text-charcoal-400">({entries.length})</span>
                </h2>
                <p className="mt-3 max-w-2xl text-sm text-charcoal-600">{KIND_BLURBS[kind]}</p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {entries.map((source) => (
                    <article
                      key={source.slug}
                      className="relative flex flex-col rounded-xl border border-charcoal-200 bg-white p-5 lift"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <a
                          href={source.url}
                          rel="noopener noreferrer"
                          className="font-semibold text-charcoal-900 hover:text-redrock-500"
                        >
                          {source.name} ↗
                        </a>
                        <span className="flex gap-1.5">
                          {verifiedWithinDays(source.lastVerifiedAt) ? (
                            <Badge variant="success">checked recently</Badge>
                          ) : null}
                          <Badge variant={STATUS_VARIANT[source.status] ?? "neutral"}>{source.status}</Badge>
                        </span>
                      </div>
                      {source.city ? (
                        <p className="mt-1 text-sm text-charcoal-500">{source.city}</p>
                      ) : null}
                      {source.games.length > 0 ? (
                        <p className="mt-2 text-xs text-charcoal-500">
                          {source.games.slice(0, 6).join(" · ")}
                          {source.games.length > 6 ? ` +${source.games.length - 6} more` : ""}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                        <Badge variant="info">
                          {ADAPTER_LABELS[source.scrapeAdapter] ?? source.scrapeAdapter}
                        </Badge>
                        {source.directoryTypes.length > 0 ? (
                          <Badge variant="neutral">
                            feeds {source.directoryTypes.join(" / ")}
                            {source.directoryImported ? " ✓" : ""}
                          </Badge>
                        ) : null}
                      </div>
                      {source.scrapeNotes ? (
                        <p className="mt-2 text-xs leading-relaxed text-charcoal-600">
                          {source.scrapeNotes}
                        </p>
                      ) : null}
                      {source.notes ? (
                        <p className="mt-1 text-xs text-charcoal-500">{source.notes}</p>
                      ) : null}
                      {source.kind === "venue" && venueSlugs.has(source.slug) ? (
                        <Link
                          href={`/places/${source.slug}`}
                          className="relative z-10 mt-2 text-xs font-medium text-redrock-500 hover:text-redrock-600"
                        >
                          Directory page (hours, gear, upcoming events) →
                        </Link>
                      ) : null}
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
