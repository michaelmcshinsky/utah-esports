import "dotenv/config";
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { scanListingPage, scrapeUrlForDraft } from "@utah-esports/scrapers";
import {
  createDraftFromDraft,
  findDuplicateForDraft,
  queueDuplicateForDraft,
} from "../src/jobs/url-import.js";

const ROOT_ENV = join(import.meta.dirname, "..", "..", "..", ".env");
if (existsSync(ROOT_ENV)) loadEnv({ path: ROOT_ENV, override: true });

/**
 * Priority sources: Meetup first (JSON-LD, no rate limit), Eventbrite last
 * (aggressive 429 after ~14 searches). Each source gets its own search terms.
 */

const MEETUP_SEARCHES = [
  "gaming",
  "board+game",
  "tabletop+rpg",
  "video+game",
  "esports",
  "smash+bros",
  "gaming+tournament",
  "game+night",
  "dungeons+and+dragons",
  "arcade",
  "card+game",
  "puzzle+hunt",
  "trivia+night",
  "ping+pong",
  "chess",
  "poker+game",
  "console+gaming",
  "retro+gaming",
  "lan+party",
  "mario+kart",
];

const EVENTBRITE_SEARCHES = [
  "https://www.eventbrite.com/d/utah/gaming/",
  "https://www.eventbrite.com/d/utah--salt-lake-city/gaming-tournament/",
  "https://www.eventbrite.com/d/utah/super-smash-bros/",
  "https://www.eventbrite.com/d/utah--salt-lake-city/video-game/",
  "https://www.eventbrite.com/d/provo--utah/gaming/",
  "https://www.eventbrite.com/d/utah--salt-lake-city/board-game/",
  "https://www.eventbrite.com/d/utah/valorant/",
  "https://www.eventbrite.com/d/utah/mario-kart/",
  "https://www.eventbrite.com/d/utah/game-night/",
];

/**
 * Positive: must match at least one of these in title/description/gameNames.
 * Negative: rejected immediately regardless of positive match.
 */
const POSITIVE_HINTS =
  /\b(gaming|gamer|game|esports?|tournament|bracket|smash|melee|ultimate|brawl|valorant|league of legends|rocket league|fortnite|minecraft|video\s*game|lan\s*party|playstation|xbox|nintendo|switch|pc\s*gaming|arcade|street\s*fighter|tekken|mortal\s*kombat|apex\s*legends|overwatch|call\s*of\s*duty|counter.?strike|dota|hearthstone|mario\s*kart|watch\s*party|board\s*game|tabletop|d&d|dungeons|rpg|warhammer|magic.*gathering|mtg|trivia|chess|poker|speedrun|fighting\s*game|fgc|platform\s*fighter|party\s*game|console|retro\s*game|pinball|ping\s*pong|puzzle|scavenger\s*hunt|quiz)\b/i;

const NEGATIVE_HINTS =
  /\b(workshop|support\s*group|mastermind|singles|speed.?dating|craft|makerspace|welding|woodshop|cnc|tig|fabricat|sewing|knitting|crochet|paint\s*night|paint\s*and\s*sip|cookie\s*decorat|pumpkin\s*paint|floral|resin|charcuterie|book\s*club|book\s*release|author\s*event|bookstore|read\s*retreat|tarot|horoscope|yoga|meditation|wellness|retirement|marketing|business|networking|career|resume|leadership|voice\s*over|voiceover|financial|investing|real\s*estate|weight\s*loss|nutrition|cooking\s*class|baking|wine\s*tasting|cocktail|beer\s*fest|bachelorette|halloween\s*party|bar\s*crawl|masquerade|costume\s*party|scavenger\s*hunt\s*(?:in|at)|haunted|ghost\s*hunt|paranormal|folk\s*festival|rock\s*fest|country\s*band|painting\s*class|pottery|glassblow|jewelry|woodwork|lathe|sublimation|embroider|calligraphy|photography\s*(?:class|walk)|gardening|bird\s*watch|hunting|fishing|climbing\s*(?:gym|class)|martial\s*arts\s*class|dance\s*class|salsa|bachata|line\s*dance|ballroom|ceramics|printing\s*class|3d\s*design|robotics\s*(?:club|class)|stem\s*(?:night|class)|science\s*fair|hiking\s*group|trail|geocaching|kayaking|snowshoe|skiing|cycling\s*(?:class|group)|running\s*club|yoga\s*class|spin\s*class|pilates|crossfit|bodybuilding|model\s*kit|airsoft|paintball|archery|axe\s*throw|bowling\s*league|softball|baseball|basketball|football|soccer|volleyball|pickleball|cornhole|billiards|pool\s*tournament|shuffleboard|darts|foosball)\b/i;

const seen = new Set<string>();
const summary = { imported: 0, duplicates: 0, skipped: 0, failed: 0, filtered: 0, past: 0 };

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Decode HTML entities so dedup compares like titles. */
function normalizeTitle(t: string): string {
  return t
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function scanWithRetry(url: string, limit: number): Promise<string[]> {
  try {
    return await scanListingPage(url, { limit });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("429")) {
      console.log(`  rate-limited, waiting 45s...`);
      await delay(45_000);
      return await scanListingPage(url, { limit });
    }
    throw e;
  }
}

async function processCandidate(url: string): Promise<void> {
  const normalized = url.split("?")[0] ?? url;
  if (seen.has(normalized)) return;
  seen.add(normalized);

  let scraped;
  try {
    scraped = await scrapeUrlForDraft(url);
  } catch (e) {
    console.log(`  ERR: ${e instanceof Error ? e.message : String(e)}`);
    summary.failed++;
    return;
  }
  if (scraped.status !== "ok") {
    summary.skipped++;
    return;
  }

  const d = scraped.draft;
  d.title = normalizeTitle(d.title);

  // Skip past events at scrape time (don't create then delete).
  if (d.startsAt && d.startsAt < new Date(Date.now() - 6 * 60 * 60 * 1000)) {
    console.log(`  past: ${d.title} (${d.startsAt.toISOString().slice(0, 10)})`);
    summary.past++;
    return;
  }

  const haystack = `${d.title} ${(d.description ?? "").slice(0, 400)} ${d.gameNames.join(" ")}`;
  if (NEGATIVE_HINTS.test(d.title) || !POSITIVE_HINTS.test(haystack)) {
    console.log(`  filtered: ${d.title}`);
    summary.filtered++;
    return;
  }

  const dup = await findDuplicateForDraft(d);
  if (dup) {
    await queueDuplicateForDraft(d, dup);
    console.log(`  dup: ${d.title}`);
    summary.duplicates++;
    return;
  }

  const id = await createDraftFromDraft(d);
  if (id) {
    console.log(`  + ${d.title} (${d.startsAt?.toISOString().slice(0, 10)}) ${d.city ?? ""}`);
    summary.imported++;
  } else {
    summary.failed++;
  }
}

// ── Phase 1: Meetup (reliable, no rate limit) ──────────────────────────
console.log("=== PHASE 1: Meetup ===");
for (const keyword of MEETUP_SEARCHES) {
  const url = `https://www.meetup.com/find/?location=us--utah--salt-lake-city&source=EVENTS&keywords=${keyword}`;
  console.log(`\n[${keyword}]`);
  try {
    const candidates = await scanWithRetry(url, 12);
    console.log(`  ${candidates.length} candidates`);
    for (const c of candidates) {
      await processCandidate(c);
      await delay(400);
    }
  } catch (e) {
    console.log(`  scan failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  await delay(1_500);
}

// Also scan Provo / Ogden areas
for (const area of ["provo--utah", "ogden--utah"]) {
  for (const keyword of ["gaming", "board+game", "esports"]) {
    const url = `https://www.meetup.com/find/?location=us--utah--${area.split("--")[1]}--${area.split("--")[0]}&source=EVENTS&keywords=${keyword}`;
    console.log(`\n[${area} ${keyword}]`);
    try {
      const candidates = await scanWithRetry(url, 8);
      console.log(`  ${candidates.length} candidates`);
      for (const c of candidates) {
        await processCandidate(c);
        await delay(400);
      }
    } catch (e) {
      console.log(`  scan failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    await delay(1_500);
  }
}

// ── Phase 2: Eventbrite (rate-limited, run last) ──────────────────────
console.log("\n=== PHASE 2: Eventbrite ===");
for (const url of EVENTBRITE_SEARCHES) {
  console.log(`\n${url}`);
  try {
    const candidates = await scanWithRetry(url, 12);
    console.log(`  ${candidates.length} candidates`);
    for (const c of candidates) {
      await processCandidate(c);
      await delay(600);
    }
  } catch (e) {
    console.log(`  scan failed: ${e instanceof Error ? e.message : String(e)}`);
  }
  await delay(4_000);
}

console.log("\n=== SUMMARY ===");
console.log(JSON.stringify(summary, null, 2));
process.exit(0);
