import type { Metadata } from "next";
import Link from "next/link";
import { desc, inArray } from "drizzle-orm";
import { Badge } from "@utah-esports/ui";
import { catalogSources } from "@utah-esports/db";
import { KIND_LABELS, KIND_BLURBS, type SourceKind } from "@utah-esports/scrapers";
import { db } from "@/src/lib/db";

export const metadata: Metadata = {
  title: "Sources",
  description:
    "Every Utah gaming site Utah Esports tracks — event platforms, venues, conventions, scholastic bodies, organizers, and community hubs — with how each one is (or isn't) scraped.",
  alternates: { canonical: "/sources" },
};

export const dynamic = "force-dynamic";

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

  const byKind = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byKind.get(row.kind) ?? [];
    list.push(row);
    byKind.set(row.kind, list);
  }

  return (
    <div className="page-container py-8">
      <h1 className="font-display text-3xl font-bold text-charcoal-900">Sources we track</h1>
      <p className="mt-2 max-w-2xl text-charcoal-600">
        Utah Esports is only as fresh as its sources. This is every site we know about that
        carries Utah gaming events, teams, or communities — what it is, whether it&apos;s still
        alive, and exactly how it gets imported. Public event pages are scraped conservatively;
        private groups are <strong>never</strong> crawled — organizers can claim their org and
        publish directly instead.
      </p>
      <p className="mt-2 max-w-2xl text-sm text-charcoal-500">
        Maintainers: the typed catalog lives in{" "}
        <code>packages/scrapers/src/catalog/utah-sources.ts</code> (seeded into this page) —
        see the repository&apos;s <code>docs/SCRAPING.md</code> for adapter how-tos and the
        batch-import CLI.{" "}
        <Link href="/organizers" className="text-redrock-600 hover:underline">
          Run one of these orgs? Claim it →
        </Link>
      </p>

      {KIND_ORDER.filter((kind) => byKind.has(kind)).map((kind) => {
        const entries = byKind.get(kind) ?? [];
        return (
          <section key={kind} className="mt-10" aria-labelledby={`kind-${kind}`}>
            <h2 id={`kind-${kind}`} className="section-heading">
              {KIND_LABELS[kind]}{" "}
              <span className="text-base font-normal text-charcoal-400">({entries.length})</span>
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-charcoal-600">{KIND_BLURBS[kind]}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((source) => (
                <article
                  key={source.slug}
                  className="relative flex flex-col rounded-card border border-charcoal-200 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <a
                      href={source.url}
                      rel="noopener noreferrer"
                      className="font-semibold text-charcoal-900 hover:text-redrock-600"
                    >
                      {source.name} ↗
                    </a>
                    <Badge variant={STATUS_VARIANT[source.status] ?? "neutral"}>{source.status}</Badge>
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
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
