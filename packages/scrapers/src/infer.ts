import type { EventType } from "@utah-esports/core";

/**
 * Title/metadata inference for scraped and legacy events.
 * Conservative: only high-signal patterns; unknowns stay unknown instead of
 * guessing (wrong game links are worse than "Other").
 */

/** Ordered longest-signal-first: [patterns..., game display name]. */
const GAME_PATTERNS: Array<{ patterns: string[]; game: string }> = [
  { patterns: ["super smash bros ultimate", "smash ultimate", "ssbu"], game: "Super Smash Bros. Ultimate" },
  { patterns: ["super smash bros melee", "melee", "ssbm"], game: "Super Smash Bros. Melee" },
  { patterns: ["super smash", "smash bros", "smash"], game: "Super Smash Bros. Ultimate" },
  { patterns: ["rocket league"], game: "Rocket League" },
  { patterns: ["league of legends"], game: "League of Legends" },
  { patterns: ["street fighter 6", "sf6"], game: "Street Fighter 6" },
  { patterns: ["street fighter", "sfv", "sfiv", "fisticuffs", "fgc"], game: "Street Fighter 6" },
  { patterns: ["tekken"], game: "Tekken 8" },
  { patterns: ["mortal kombat", "mk1"], game: "Mortal Kombat 1" },
  { patterns: ["counter-strike", "counter strike", "csgo", "cs:go", "cs2"], game: "Counter-Strike 2" },
  { patterns: ["valorant"], game: "VALORANT" },
  { patterns: ["apex legends", "apex"], game: "Apex Legends" },
  { patterns: ["overwatch"], game: "Overwatch 2" },
  { patterns: ["halo"], game: "Halo Infinite" },
  { patterns: ["fortnite"], game: "Fortnite" },
  { patterns: ["mario kart"], game: "Mario Kart 8 Deluxe" },
  { patterns: ["pokemon", "pokken"], game: "Pokémon Scarlet/Violet" },
  { patterns: ["dota"], game: "Dota 2" },
  { patterns: ["starcraft"], game: "StarCraft II" },
  { patterns: ["hearthstone"], game: "Hearthstone" },
  { patterns: ["teamfight tactics", "tft"], game: "Teamfight Tactics" },
  { patterns: ["marvel rivals"], game: "Marvel Rivals" },
  { patterns: ["ea sports fc", "fifa"], game: "EA Sports FC" },
];

export function inferGamesFromTitle(title: string): string[] {
  const haystack = ` ${title.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `;
  const found: string[] = [];
  for (const { patterns, game } of GAME_PATTERNS) {
    if (found.includes(game)) continue;
    if (patterns.some((p) => haystack.includes(` ${p.replace(/[^a-z0-9]+/g, " ")} `) || haystack.includes(` ${p.replace(/[^a-z0-9]+/g, " ")}s `))) {
      found.push(game);
    }
  }
  return found;
}

export function inferEventType(title: string): EventType {
  const t = title.toLowerCase();
  if (/(viewing|pubstomp|watch\s*party|watchparty)/.test(t)) return "watch_party";
  if (/tryout/.test(t)) return "tryout";
  if (/workshop|clinic|bootcamp/.test(t)) return "workshop";
  if (/(league|season|ladder)/.test(t)) return "league";
  if (
    /(tournament|championship|brawl|skirmish|showdown|royale|1v1|2v2|3v3|bracket|comp(e|eti)t|open\s*(run|play)|grand\s*prize|pot\s*bonus)/.test(
      t,
    )
  )
    return "tournament";
  if (/(weekly|monthly|game\s*night|game-night|lan\s*party|jam|meetup|meet-up|social|block\s*party)/.test(t))
    return "casual";
  return "other";
}

/**
 * Entry-price extraction. Scans every "$N" in the text and accepts it only
 * when an entry-style keyword sits in the surrounding window — so
 * "$10 entry, $200 pot bonus" correctly resolves to $10, never $200.
 */
const ENTRY_KEYWORD =
  /\b(entry|door|admission|buy-?in|reg(?:istration)?|cost|per\s*person)\b/;

export function extractPriceCents(text: string): number | null {
  const t = text.toLowerCase();
  if (/\bfree\b|\$0\b/.test(t)) return 0;
  const moneyRe = /\$\s?(\d{1,3})(?:\.(\d{2}))?/g;
  let m: RegExpExecArray | null;
  while ((m = moneyRe.exec(t)) !== null) {
    const start = Math.max(0, m.index - 20);
    const end = Math.min(t.length, m.index + m[0].length + 20);
    const window = t.slice(start, end);
    if (ENTRY_KEYWORD.test(window)) {
      const dollars = Number(m[1]);
      const cents = m[2] ? Number(m[2]) : 0;
      return dollars * 100 + cents;
    }
  }
  return null;
}

/** Infer a full legacy-style metadata bundle from a title (+ optional body). */
export function inferEventMetadata(
  title: string,
  body?: string | null,
): { gameNames: string[]; eventType: EventType; priceCents: number | null } {
  const gameNames = inferGamesFromTitle(title);
  const eventType = inferEventType(title);
  const priceCents = extractPriceCents(`${title} ${body ?? ""}`);
  return { gameNames, eventType, priceCents };
}
