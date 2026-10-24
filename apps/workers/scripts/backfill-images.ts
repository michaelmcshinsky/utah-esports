import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { eq, isNull, and, gte } from "drizzle-orm";
import { eventOccurrences, getDb } from "@utah-esports/db";
import { scrapeUrlForDraft } from "@utah-esports/scrapers";

const ROOT_ENV = join(import.meta.dirname, "..", "..", "..", ".env");
if (existsSync(ROOT_ENV)) loadEnv({ path: ROOT_ENV, override: true });

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const db = getDb();

// Published upcoming events with no image
const events = await db
  .select({
    id: eventOccurrences.id,
    slug: eventOccurrences.slug,
    title: eventOccurrences.title,
    registrationUrl: eventOccurrences.registrationUrl,
    sourceRecordId: eventOccurrences.sourceRecordId,
  })
  .from(eventOccurrences)
  .where(
    and(
      eq(eventOccurrences.status, "published"),
      gte(eventOccurrences.startsAt, new Date(Date.now() - 6 * 60 * 60 * 1000)),
      isNull(eventOccurrences.imageUrl),
    ),
  )
  .limit(100);

console.log(`Found ${events.length} events missing images.\n`);

let updated = 0;
let failed = 0;
let skipped = 0;

for (const event of events) {
  const url = event.registrationUrl;
  if (!url) {
    console.log(`  skip (no URL): ${event.slug}`);
    skipped++;
    continue;
  }

  console.log(`  scraping: ${event.slug}`);
  try {
    const result = await scrapeUrlForDraft(url);
    if (result.status !== "ok") {
      console.log(`    -> no draft (${result.status})`);
      failed++;
      continue;
    }
    const imageUrl = result.draft.imageUrl;
    if (!imageUrl) {
      console.log(`    -> no image on source`);
      skipped++;
      continue;
    }
    await db
      .update(eventOccurrences)
      .set({ imageUrl, updatedAt: new Date() })
      .where(eq(eventOccurrences.id, event.id));
    console.log(`    -> image set: ${imageUrl.slice(0, 80)}`);
    updated++;
  } catch (e) {
    console.log(`    -> error: ${e instanceof Error ? e.message : String(e)}`);
    failed++;
  }
  await delay(800);
}

console.log(`\n=== Done: ${updated} updated, ${skipped} skipped, ${failed} failed ===`);
process.exit(0);
