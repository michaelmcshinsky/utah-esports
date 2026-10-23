import { eq } from "drizzle-orm";
import {
  catalogSources,
  getDb,
} from "@utah-esports/db";
import { scanListingPage, VENUE_SOURCE_URLS, scrapeUrlForDraft } from "@utah-esports/scrapers";
import { createDraftFromDraft, findDuplicateForDraft } from "./url-import.js";
import { log } from "../lib/logger.js";

export type VenueScanSummary = {
  source: string;
  candidates: number;
  imported: number;
  duplicates: number;
  skipped: number;
  failed: number;
};

/**
 * Scan a venue/community listing page and import new events as drafts.
 * Tolerant by design: a dead or reworked site yields a failed count, never
 * an exception, and duplicate matches are skipped (moderators can review
 * them on-site instead).
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

/** Scan the built-in venue source list (best-effort, never throws). */
export async function runVenueSourceScan(
  opts: { limit?: number; startggToken?: string } = {},
): Promise<{ sources: number; imported: number; duplicates: number }> {
  let imported = 0;
  let duplicates = 0;
  let sources = 0;
  for (const source of VENUE_SOURCE_URLS) {
    const summary = await scanVenueSource(source.url, source.name, opts);
    sources++;
    imported += summary.imported;
    duplicates += summary.duplicates;
  }
  log("info", "venue-scan", "scan complete", { sources, imported, duplicates });
  return { sources, imported, duplicates };
}
