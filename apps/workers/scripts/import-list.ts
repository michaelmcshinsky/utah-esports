import "dotenv/config";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import { scanListingPage, scrapeUrlForDraft } from "@utah-esports/scrapers";
import { createDraftFromDraft, findDuplicateForDraft, queueDuplicateForDraft } from "../src/jobs/url-import.js";

/**
 * Scan a listing page and import candidate events as drafts.
 *   pnpm --filter @utah-esports/workers exec tsx scripts/import-list.ts <listing-url> [--limit N]
 */
const ROOT_ENV = join(import.meta.dirname, "..", "..", "..", ".env");
if (existsSync(ROOT_ENV)) loadEnv({ path: ROOT_ENV, override: true });

const args = process.argv.slice(2);
const url = args.find((a) => /^https?:\/\//.test(a));
const limitArg = args.indexOf("--limit");
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : 8;

if (!url) {
  console.error("Usage: tsx scripts/import-list.ts <listing-url> [--limit N]");
  process.exit(1);
}

console.log(`Scanning ${url} (limit ${limit})…`);
const candidates = await scanListingPage(url, { limit });
console.log(`Found ${candidates.length} candidate event URL(s).`);

const summary = { imported: 0, duplicates: 0, failed: 0 };
for (const candidateUrl of candidates) {
  process.stdout.write(` → ${candidateUrl} … `);
  const scraped = await scrapeUrlForDraft(candidateUrl);
  if (scraped.status !== "ok") {
    console.log(`skip (${scraped.status}: ${scraped.error.slice(0, 80)})`);
    summary.failed++;
    continue;
  }
  const duplicate = await findDuplicateForDraft(scraped.draft);
  if (duplicate) {
    await queueDuplicateForDraft(scraped.draft, duplicate);
    console.log(`duplicate of ${duplicate.slug} (score ${duplicate.score}) — queued for review`);
    summary.duplicates++;
    continue;
  }
  const eventId = await createDraftFromDraft(scraped.draft);
  if (eventId) {
    console.log(`✓ draft: ${scraped.draft.title}`);
    summary.imported++;
  } else {
    console.log("✗ could not create draft");
    summary.failed++;
  }
}
console.log(
  `\nDone: ${summary.imported} imported, ${summary.duplicates} duplicates skipped, ${summary.failed} failed.`,
);
process.exit(summary.failed === candidates.length && candidates.length > 0 ? 1 : 0);
