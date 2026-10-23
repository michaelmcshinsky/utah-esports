import { eq, inArray } from "drizzle-orm";
import { catalogSources, getDb } from "@utah-esports/db";
import { scanListingPage, VENUE_SOURCE_URLS, scrapeUrlForDraft } from "@utah-esports/scrapers";
import { createDraftFromDraft, findDuplicateForDraft, queueDuplicateForDraft } from "./url-import.js";
import { log } from "../lib/logger.js";

export type VenueScanSummary = {
  source: string;
  candidates: number;
  imported: number;
  duplicates: number;
  skipped: number;
  failed: number;
};

/** Listing-page URLs to scan: built-in venue list + catalog scrapeUrls (one fetch set, deduped). */
export async function listingScanTargets(): Promise<Array<{ name: string; url: string }>> {
  const targets = new Map<string, string>();
  for (const source of VENUE_SOURCE_URLS) {
    targets.set(source.url, source.name);
  }
  const db = getDb();
  const catalogRows = await db
    .select({ name: catalogSources.name, scrapeUrls: catalogSources.scrapeUrls })
    .from(catalogSources)
    .where(inArray(catalogSources.status, ["active", "unknown"]));
  for (const row of catalogRows) {
    for (const listingUrl of row.scrapeUrls) {
      if (!targets.has(listingUrl)) targets.set(listingUrl, row.name);
    }
  }
  return [...targets].map(([url, name]) => ({ url, name }));
}

/**
 * Scan a venue/community listing page and import new events as drafts.
 * Tolerant by design: a dead or reworked site yields a failed count, never
 * an exception. Duplicate matches are queued for moderator review instead
 * of being silently skipped.
 */
export async function scanVenueSource(
  url: string,
  name: string,
  opts: { limit?: number; startggToken?: string } = {},
): Promise<VenueScanSummary> {
  const summary: VenueScanSummary = {
    source: name,
    candidates: 0,
    imported: 0,
    duplicates: 0,
    skipped: 0,
    failed: 0,
  };
  let candidates: string[];
  try {
    candidates = await scanListingPage(url, { limit: opts.limit ?? 8 });
  } catch (err) {
    log("warn", "venue-scan", "listing scan failed", {
      source: name,
      url,
      error: err instanceof Error ? err.message : String(err),
    });
    summary.failed++;
    return summary;
  }
  summary.candidates = candidates.length;

  // A responsive, parseable listing confirms the catalog entry is still live.
  if (candidates.length > 0) {
    try {
      const db = getDb();
      await db
        .update(catalogSources)
        .set({ lastVerifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(catalogSources.url, url));
    } catch {
      // Catalog update is best-effort; scanning continues either way.
    }
  }

  for (const candidateUrl of candidates) {
    try {
      const scraped = await scrapeUrlForDraft(candidateUrl, {
        ...(opts.startggToken ? { startggToken: opts.startggToken } : {}),
      });
      if (scraped.status !== "ok") {
        summary.skipped++;
        continue;
      }
      const duplicate = await findDuplicateForDraft(scraped.draft);
      if (duplicate) {
        await queueDuplicateForDraft(scraped.draft, duplicate);
        summary.duplicates++;
        continue;
      }
      const eventId = await createDraftFromDraft(scraped.draft);
      if (eventId) summary.imported++;
      else summary.failed++;
    } catch {
      summary.failed++;
    }
  }

  log("info", "venue-scan", "source complete", { ...summary, url });
  return summary;
}

/** Scan built-in + catalog listing sources (best-effort, never throws). */
export async function runVenueSourceScan(
  opts: { limit?: number; startggToken?: string } = {},
): Promise<{ sources: number; imported: number; duplicates: number }> {
  let imported = 0;
  let duplicates = 0;
  let sources = 0;
  let targets: Array<{ name: string; url: string }>;
  try {
    targets = await listingScanTargets();
  } catch {
    // DB unavailable (bare CLI): fall back to the built-in list.
    targets = VENUE_SOURCE_URLS;
  }
  for (const target of targets) {
    const summary = await scanVenueSource(target.url, target.name, opts);
    sources++;
    imported += summary.imported;
    duplicates += summary.duplicates;
  }
  log("info", "venue-scan", "scan complete", { sources, imported, duplicates });
  return { sources, imported, duplicates };
}
