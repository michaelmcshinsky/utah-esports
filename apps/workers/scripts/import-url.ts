import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { importEventFromUrl } from "../src/jobs/url-import.js";

/**
 * CLI: import an event URL as a draft (review before publish).
 *   pnpm --filter @utah-esports/workers exec tsx scripts/import-url.ts <url>
 */
const ROOT_ENV = join(import.meta.dirname, "..", "..", "..", ".env");
if (existsSync(ROOT_ENV)) loadEnv({ path: ROOT_ENV, override: true });

const url = process.argv[2];
if (!url) {
  console.error("Usage: tsx scripts/import-url.ts <event-url>");
  process.exit(1);
}

const result = await importEventFromUrl(url);
if (result.status === "draft_created") {
  console.log(`✓ Draft created: ${result.draft.title} (${result.eventId})`);
  console.log(`  adapter: ${result.draft.source.adapter} · games: ${result.draft.gameNames.join(", ") || "—"} · type: ${result.draft.eventType}`);
  process.exit(0);
}
if (result.status === "duplicate") {
  console.log(`⚠ Likely duplicate of "${result.duplicate.title}" (${result.duplicate.slug}, score ${result.duplicate.score}) — review before importing.`);
  process.exit(2);
}
if (result.status === "no_match") {
  console.log(`No event data found: ${result.error}`);
  process.exit(3);
}
if (result.status === "error") {
  console.error(`✗ Import failed${result.adapter ? ` (${result.adapter})` : ""}: ${result.error}`);
  process.exit(1);
}
console.error("✗ Import failed unexpectedly");
process.exit(1);
