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

const SEARCH_URLS = [
  // Utah — core gaming terms
  "https://www.eventbrite.com/d/utah--salt-lake-city/gaming-tournament/",
  "https://www.eventbrite.com/d/utah--salt-lake-city/smash-bros/",
  "https://www.eventbrite.com/d/utah--salt-lake-city/esports-tournament/",
  "https://www.eventbrite.com/d/utah--salt-lake-city/video-game/",
  "https://www.eventbrite.com/d/utah/super-smash-bros/",
  "https://www.eventbrite.com/d/utah/gaming/",
  "https://www.eventbrite.com/d/provo--utah/gaming/",
  "https://www.eventbrite.com/d/utah--salt-lake-city/lan-party/",
  // Utah — specific titles
  "https://www.eventbrite.com/d/utah/valorant/",
  "https://www.eventbrite.com/d/utah/mario-kart/",
  "https://www.eventbrite.com/d/utah/rocket-league/",
  "https://www.eventbrite.com/d/utah/league-of-legends/",
  "https://www.eventbrite.com/d/utah/street-fighter/",
  "https://www.eventbrite.com/d/utah/mortal-kombat/",
  "https://www.eventbrite.com/d/utah/tekken/",
  "https://www.eventbrite.com/d/utah/minecraft/",
  "https://www.eventbrite.com/d/utah/fortnite/",
  "https://www.eventbrite.com/d/utah/apex-legends/",
  "https://www.eventbrite.com/d/utah/overwatch/",
  "https://www.eventbrite.com/d/utah/call-of-duty/",
  "https://www.eventbrite.com/d/utah/marvel-rivals/",
  "https://www.eventbrite.com/d/utah/street-fighter-6/",
  // Utah — game night / arcade / retro
  "https://www.eventbrite.com/d/utah/game-night/",
  "https://www.eventbrite.com/d/utah--salt-lake-city/game-night/",
  "https://www.eventbrite.com/d/utah/arcade/",
  "https://www.eventbrite.com/d/utah/retro-gaming/",
  // Cities
  "https://www.eventbrite.com/d/provo--utah/esports/",
  "https://www.eventbrite.com/d/ogden--utah/gaming/",
  "https://www.eventbrite.com/d/utah-county--utah/gaming/",
  "https://www.eventbrite.com/d/utah/trivia-night/",
  "https://www.eventbrite.com/d/utah--salt-lake-city/board-game/",
];

const GAMING_HINTS =
  /\b(gaming|game|esports?|tournament|smash|valorant|league of legends|rocket league|fortnite|minecraft|video game|lan\s*party|bracket|competitive|playstation|xbox|nintendo|pc gaming|gamer|arcade|street fighter|tekken|mortal kombat|apex legends|overwatch|call of duty|counter.?strike|dota|hearthstone|super smash|melee|ultimate|brawl|watch party|mario kart|smash ultimate|trivia|board game|tabletop|d&d|dungeons|rpg|puzzle|speedrun|speedrun|fighting game|fgc|platform fighter|party game|cozy game|speedrun)\b/i;

const seen = new Set<string>();
const summary = { imported: 0, duplicates: 0, skipped: 0, failed: 0, filtered: 0 };

for (const searchUrl of SEARCH_URLS) {
  console.log(`\nScanning: ${searchUrl}`);
  let candidates: string[];
  try {
    candidates = await scanListingPage(searchUrl, { limit: 15 });
  } catch (e) {
    console.log(`  scan failed: ${e instanceof Error ? e.message : String(e)}`);
    continue;
  }
  console.log(`  ${candidates.length} candidates`);

  for (const url of candidates) {
    const normalized = url.split("?")[0] ?? url;
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    let scraped;
    try {
      scraped = await scrapeUrlForDraft(url);
    } catch (e) {
      console.log(`  ERR ${normalized}: ${e instanceof Error ? e.message : String(e)}`);
      summary.failed++;
      continue;
    }
    if (scraped.status !== "ok") {
      summary.skipped++;
      continue;
    }

    const d = scraped.draft;
    const haystack = `${d.title} ${(d.description ?? "").slice(0, 300)} ${d.gameNames.join(" ")}`;
    if (!GAMING_HINTS.test(haystack)) {
      console.log(`  filtered (not gaming): ${d.title}`);
      summary.filtered++;
      continue;
    }

    const dup = await findDuplicateForDraft(d);
    if (dup) {
      await queueDuplicateForDraft(d, dup);
      console.log(`  dup: ${d.title}`);
      summary.duplicates++;
      continue;
    }
    const id = await createDraftFromDraft(d);
    if (id) {
      console.log(`  + draft: ${d.title} (${d.startsAt?.toISOString().slice(0, 10)})`);
      summary.imported++;
    } else {
      summary.failed++;
    }
  }
}

console.log("\n=== SUMMARY ===");
console.log(JSON.stringify(summary, null, 2));
process.exit(0);
