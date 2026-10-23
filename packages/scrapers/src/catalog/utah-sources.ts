/**
 * Utah Esports source catalog — the authoritative list of Utah gaming sites:
 * event platforms, venues, conventions, scholastic bodies, organizers, and
 * community hubs, each with scrape instructions and directory coverage.
 *
 * This file is the source of truth. It seeds `catalog_sources` (packages/db)
 * and generates docs/SOURCES.md (scripts/generate-sources-doc.ts).
 *
 * Status vocabulary (be honest — don't claim a dead site is active):
 *   active    — verified working recently
 *   unknown   — existed historically; not verified recently
 *   defunct   — known closed/gone
 *   archived  — content preserved (e.g., the 2018–19 Jekyll site)
 */

export type SourceKind =
  | "event_platform"
  | "venue"
  | "convention"
  | "scholastic"
  | "organizer"
  | "community_hub"
  | "media";

export type SourceStatus = "active" | "unknown" | "defunct" | "archived";

export type SourceEntry = {
  slug: string;
  name: string;
  kind: SourceKind;
  url: string;
  city?: string;
  region?: string;
  /** Game slugs from our taxonomy (packages/db seed). */
  games?: string[];
  status: SourceStatus;
  scrape: {
    /** Adapter id from @utah-esports/scrapers, or "manual" / "none". */
    adapter: string;
    /** Index/listing pages worth scanning for event links. */
    listingUrls?: string[];
    /** URL path patterns that mark a link as an event page. */
    eventUrlPatterns?: string[];
    notes?: string;
  };
  /** What directory data this source feeds (or should feed). */
  directory?: {
    types: Array<"vendor" | "club" | "team" | "social_group" | "streamer">;
    imported: boolean;
    notes?: string;
  };
  notes?: string;
};

export const KIND_LABELS: Record<SourceKind, string> = {
  event_platform: "Event platforms",
  venue: "Venues & LAN centers",
  convention: "Conventions",
  scholastic: "Scholastic & governing bodies",
  organizer: "Organizers",
  community_hub: "Community hubs",
  media: "Media",
};

export const KIND_BLURBS: Record<SourceKind, string> = {
  event_platform:
    "Where tournaments and calendars live. start.gg syncs automatically when a token is configured; everything else imports via URL paste or listing scans.",
  venue:
    "LAN centers, arcades, and bar-cades that host recurring events. Weekly scans look for new event pages; hours/gear details come from organizers.",
  convention:
    "Gaming conventions and expos with Utah footprints. Events are imported per-URL — conventions don't maintain steady calendars.",
  scholastic:
    "Governing bodies and school-league platforms. We link to official pages — eligibility and contacts stay with the institutions.",
  organizer:
    "Event-running orgs whose calendars matter most. Claim these on the dashboard to publish directly instead of being scraped.",
  community_hub:
    "Discord servers and Facebook groups. Listed as destinations — we never scrape private or group content; organizers can authorize announcements.",
  media:
    "Local coverage and streams that surface Utah events. Useful for discovery tips; not a primary event source.",
};

export const UTAH_SOURCES: SourceEntry[] = [
  // ---------------------------------------------------------------- platforms
  {
    slug: "start-gg",
    name: "start.gg",
    kind: "event_platform",
    url: "https://start.gg",
    status: "active",
    games: [
      "super-smash-brothers-ultimate",
      "super-smash-brothers-melee",
      "rocket-league",
      "valorant",
      "league-of-legends",
      "street-fighter-6",
      "tekken-8",
      "mortal-kombat-1",
      "guilty-gear-strive",
      "mario-kart-8-deluxe",
      "counter-strike-2",
      "apex-legends",
    ],
    scrape: {
      adapter: "startgg-url",
      notes:
        "Official GraphQL API (STARTGG_TOKEN). Utah-window sync runs every 6h; single tournaments import from start.gg/tournament/<slug> URLs with duplicate review.",
    },
    notes: "Primary tournament platform for Utah Smash, FGC, and growing scenes.",
  },
  {
    slug: "legacy-jekyll-site",
    name: "utah-esports-website (2018–2019 archive)",
    kind: "event_platform",
    url: "https://github.com/michaelmcshinsky/utah-esports-website",
    status: "archived",
    scrape: {
      adapter: "legacy-jekyll",
      notes:
        "GitHub markdown frontmatter. Fully imported: 157 events, 11 venues, 54 communities, 12 teams, with inferred games/types/prices and migrated posters.",
    },
    directory: {
      types: ["vendor", "club", "team", "social_group"],
      imported: true,
      notes: "The seed of the current directory; rows are labeled needs_verification until organizers re-confirm.",
    },
    notes: "Historical source of truth for the original utahesports.net.",
  },
  {
    slug: "facebook-events",
    name: "Facebook Events (Utah gaming groups)",
    kind: "event_platform",
    url: "https://www.facebook.com/groups/",
    status: "active",
    scrape: {
      adapter: "generic-event",
      notes:
        "Paste a PUBLIC event URL on /submit to autofill (JSON-LD when present). Group feeds are not crawled — organizers and members submit links.",
    },
    directory: {
      types: ["social_group"],
      imported: true,
      notes: "Utah Smash, Utah Melee, Cache Valley Smash, Utah LoL and ~50 more groups are seeded as community pages with their group links.",
    },
  },
  {
    slug: "eventbrite",
    name: "Eventbrite",
    kind: "event_platform",
    url: "https://www.eventbrite.com",
    status: "active",
    scrape: {
      adapter: "generic-event",
      notes: "Public event pages carry schema.org JSON-LD — paste the URL to import; listing scans work on organizer profile pages.",
    },
  },
  {
    slug: "toornament",
    name: "Toornament",
    kind: "event_platform",
    url: "https://www.toornament.com",
    status: "unknown",
    scrape: { adapter: "generic-event", notes: "Paste individual tournament URLs; JSON-LD coverage varies by organizer." },
  },
  {
    slug: "battlefy",
    name: "Battlefy",
    kind: "event_platform",
    url: "https://battlefy.com",
    status: "unknown",
    scrape: { adapter: "generic-event", notes: "Paste individual tournament URLs; confirm registration links after import." },
  },
  {
    slug: "faceit",
    name: "FACEIT",
    kind: "event_platform",
    url: "https://www.faceit.com",
    status: "active",
    games: ["counter-strike-2", "valorant", "apex-legends"],
    scrape: { adapter: "generic-event", notes: "Used by some Utah FPS scenes; import via tournament URL paste." },
  },
  {
    slug: "gyo",
    name: "GYO",
    kind: "event_platform",
    url: "https://gyo.gg",
    status: "unknown",
    notes: "Legacy tournament platform referenced by 2018–19 venue pages (e.g. gyo.gg/venue/lan-king). Mostly historical.",
    scrape: { adapter: "generic-event", notes: "Best-effort via URL paste; links may be dead." },
  },
  {
    slug: "challonge",
    name: "Challonge",
    kind: "event_platform",
    url: "https://challonge.com",
    status: "active",
    notes: "Brackets more than event calendars — used by organizers we link out to; not scraped directly.",
    scrape: { adapter: "none", notes: "Bracket hosting only; registration usually lives elsewhere." },
  },

  // ---------------------------------------------------------------- venues
  {
    slug: "lan-king",
    name: "LAN King",
    kind: "venue",
    url: "http://lanking.us/",
    city: "Midvale",
    region: "utah_valley",
    games: ["super-smash-brothers-ultimate", "super-smash-brothers-melee"],
    status: "unknown",
    scrape: {
      adapter: "generic-event",
      listingUrls: ["http://lanking.us/"],
      notes: "Long-running Midvale LAN; site + Facebook. Venue details seeded from the legacy directory.",
    },
    directory: { types: ["vendor"], imported: true },
    notes: "Home of historic Smash monthlies (Smash Royale) and weeklies.",
  },
  {
    slug: "game-grid",
    name: "Game Grid",
    kind: "venue",
    url: "https://www.playatgamegrid.com/",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    status: "unknown",
    scrape: {
      adapter: "generic-event",
      listingUrls: ["https://www.playatgamegrid.com/"],
      notes: "Arcade/LAN with weekly scenes (Sandy grand opening events in 2018).",
    },
    directory: { types: ["vendor"], imported: true },
  },
  {
    slug: "quarters-arcade-bar",
    name: "Quarters Arcade Bar",
    kind: "venue",
    url: "https://www.quartersslc.com/",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    status: "active",
    scrape: {
      adapter: "generic-event",
      listingUrls: ["https://www.quartersslc.com/events", "https://www.quartersslc.com/"],
      notes: "Bar-cade with recurring fighting-game and casual nights; site has an events calendar.",
    },
    directory: { types: ["vendor"], imported: true },
  },
  {
    slug: "nokto-esports",
    name: "Nokto Esports",
    kind: "venue",
    url: "https://nokto.gg/",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    games: ["super-smash-brothers-ultimate", "super-smash-brothers-melee"],
    status: "unknown",
    scrape: {
      adapter: "generic-event",
      listingUrls: ["https://nokto.gg/"],
      notes: "Ran Smash weeklies and monthly game nights (2018–19); verify the site before scanning.",
    },
    directory: { types: ["vendor"], imported: true },
  },
  {
    slug: "tournament-ready-esports",
    name: "Tournament Ready Esports",
    kind: "venue",
    url: "https://www.tournamentreadyesports.com/",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    status: "unknown",
    scrape: { adapter: "generic-event", listingUrls: ["https://www.tournamentreadyesports.com/"] },
    directory: { types: ["vendor"], imported: true },
  },
  {
    slug: "bonus-stage-arena",
    name: "Bonus Stage Arena",
    kind: "venue",
    url: "https://www.bonusstagearena.com/",
    city: "Ogden",
    region: "davis_weber",
    status: "unknown",
    scrape: { adapter: "generic-event", listingUrls: ["https://www.bonusstagearena.com/"] },
    directory: { types: ["vendor"], imported: true },
  },
  {
    slug: "gamer-planet",
    name: "Gamer Planet",
    kind: "venue",
    url: "https://gamerplanet.net/",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    status: "unknown",
    scrape: { adapter: "generic-event", listingUrls: ["https://gamerplanet.net/"] },
    directory: { types: ["vendor"], imported: true },
  },
  {
    slug: "the-geekwave",
    name: "The Geekwave",
    kind: "venue",
    url: "http://thegeekwave.com/",
    city: "Orem",
    region: "utah_valley",
    status: "unknown",
    scrape: { adapter: "generic-event", listingUrls: ["http://thegeekwave.com/"] },
    directory: { types: ["vendor"], imported: true },
  },
  {
    slug: "gt-throne",
    name: "GT Throne",
    kind: "venue",
    url: "https://gtthrone.com/",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    status: "unknown",
    scrape: { adapter: "generic-event", listingUrls: ["https://gtthrone.com/"] },
    directory: { types: ["vendor"], imported: true },
  },
  {
    slug: "viceroy-kicks",
    name: "Viceroy Kicks",
    kind: "venue",
    url: "http://viceroykicks.com/",
    status: "unknown",
    scrape: { adapter: "generic-event", listingUrls: ["http://viceroykicks.com/"] },
    directory: { types: ["vendor"], imported: true },
  },
  {
    slug: "microsoft-store-city-creek",
    name: "Microsoft Store — City Creek (closed)",
    kind: "venue",
    url: "https://www.shopcitycreekcenter.com/stores/microsoft",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    status: "defunct",
    notes: "Hosted Xbox events circa 2018; Microsoft retail stores have since closed.",
    scrape: { adapter: "none", notes: "Defunct — do not scan." },
    directory: { types: ["vendor"], imported: true },
  },
  {
    slug: "round-one-sandy",
    name: "Round One — Sandy",
    kind: "venue",
    url: "https://round1-us.com/",
    city: "Sandy",
    region: "salt_lake_valley",
    games: ["street-fighter-6", "tekken-8"],
    status: "unknown",
    notes: "Arcade/bowling chain venue that hosted SLC fighting-game weeklies (2018 'Round 1 Sandy' events).",
    scrape: {
      adapter: "generic-event",
      listingUrls: ["https://round1-us.com/locations/"],
      notes: "Chain site — scan only the Sandy location page; FGC weeklies also announced on Facebook.",
    },
  },
  {
    slug: "gamet-yrant-arcade",
    name: "GameTyrant Arcade",
    kind: "venue",
    url: "https://gametyrant.com/",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    games: ["super-smash-brothers-melee", "street-fighter-6", "dota-2"],
    status: "defunct",
    notes: "SLC arcade behind GameTyrant Melee/FGC Monthlies and Dota tournaments (2018–19). Closure reported; verify before linking.",
    scrape: { adapter: "none", notes: "Defunct — historical events only." },
  },

  // ---------------------------------------------------------------- conventions
  {
    slug: "fanx",
    name: "FanX Salt Lake Comic Convention",
    kind: "convention",
    url: "https://fanxsaltlake.com/",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    status: "active",
    notes: "Major SLC convention with gaming areas and exhibitor scenes.",
    scrape: {
      adapter: "generic-event",
      listingUrls: ["https://fanxsaltlake.com/"],
      notes: "Import individual panel/expo URLs; schedule pages drop JSON-LD seasonally.",
    },
  },
  {
    slug: "pop-con",
    name: "Pop Con",
    kind: "convention",
    url: "https://www.facebook.com/popconsaltlake/",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    status: "unknown",
    notes: "Utah gaming convention (2018–19 events on the legacy site: Pop Con, Cosplay Ball).",
    scrape: { adapter: "generic-event", notes: "Facebook-hosted announcements; paste public event URLs." },
  },
  {
    slug: "salt-con",
    name: "Salt Con",
    kind: "convention",
    url: "https://www.facebook.com/saltcon/",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    status: "unknown",
    notes: "Local con with gaming tournaments (2018–19 archive).",
    scrape: { adapter: "generic-event", notes: "Facebook-hosted; paste public event URLs." },
  },
  {
    slug: "gam-convention",
    name: "GAM Convention",
    kind: "convention",
    url: "https://www.facebook.com/gamutah/",
    city: "Utah Valley",
    region: "utah_valley",
    status: "defunct",
    notes: "Games-and-media convention (Jan 2019 archive).",
    scrape: { adapter: "none", notes: "Defunct — historical only." },
  },

  // ---------------------------------------------------------------- scholastic
  {
    slug: "uhsaa",
    name: "UHSAA",
    kind: "scholastic",
    url: "https://www.uhsaa.org/",
    status: "active",
    notes: "Utah High School Activities Association — governs sanctioned scholastic esports championships.",
    scrape: { adapter: "none", notes: "Official championship info; link out, don't scrape." },
  },
  {
    slug: "playvs",
    name: "PlayVS",
    kind: "scholastic",
    url: "https://www.playvs.com/",
    status: "active",
    notes: "Season-based school league platform used by Utah schools.",
    scrape: { adapter: "none", notes: "League platform; schools list their own programs here." },
  },
  {
    slug: "ken-garff-esports",
    name: "Ken Garff Esports",
    kind: "scholastic",
    url: "https://kengarffesports.com/",
    status: "active",
    notes: "School-oriented programming and events across Utah.",
    scrape: { adapter: "generic-event", notes: "Scan homepage for event links; mostly registration pages." },
  },
  {
    slug: "uvu-esports",
    name: "UVU Esports (Crimson Gaming)",
    kind: "scholastic",
    url: "https://www.uvu.edu/recsports/esports/",
    city: "Orem",
    region: "utah_valley",
    status: "active",
    scrape: { adapter: "generic-event", listingUrls: ["https://www.uvu.edu/recsports/esports/"] },
    directory: { types: ["team"], imported: true, notes: "Crimson Gaming seeded as a collegiate team/org." },
  },
  {
    slug: "university-of-utah-esports",
    name: "University of Utah Esports (EAE)",
    kind: "scholastic",
    url: "https://eae.utah.edu/esports/",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    status: "active",
    scrape: { adapter: "generic-event", listingUrls: ["https://eae.utah.edu/esports/"] },
    directory: { types: ["team"], imported: true },
  },
  {
    slug: "byu-esports",
    name: "BYU Esports",
    kind: "scholastic",
    url: "https://clubs.byu.edu/clubs#/esports-vgame",
    city: "Provo",
    region: "utah_valley",
    status: "active",
    scrape: { adapter: "none", notes: "Club directory page; events surface via campus channels." },
    directory: { types: ["team"], imported: true },
  },
  {
    slug: "usu-esports",
    name: "USU Esports",
    kind: "scholastic",
    url: "https://www.usu.edu/",
    city: "Logan",
    region: "cache_valley",
    status: "unknown",
    scrape: { adapter: "generic-event", notes: "Program pages move; verify current URL before scanning." },
    directory: { types: ["team"], imported: true },
  },
  {
    slug: "weber-state-esports",
    name: "Weber State Esports (Claw Gaming)",
    kind: "scholastic",
    url: "https://www.weber.edu/",
    city: "Ogden",
    region: "davis_weber",
    status: "unknown",
    scrape: { adapter: "generic-event", notes: "Verify current program URL." },
    directory: { types: ["team"], imported: true },
  },
  {
    slug: "pacg",
    name: "Pacific Alliance of Collegiate Gamers (PACG)",
    kind: "scholastic",
    url: "https://pac.gg/",
    status: "unknown",
    notes: "Multi-school collegiate alliance with Utah members (UVU, BYU…).",
    scrape: { adapter: "generic-event", listingUrls: ["https://pac.gg/"] },
    directory: { types: ["team"], imported: true },
  },

  // ---------------------------------------------------------------- organizers
  {
    slug: "no-pause-gaming",
    name: "No Pause Gaming",
    kind: "organizer",
    url: "https://www.facebook.com/NoPauseGaming1/",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    games: ["league-of-legends"],
    status: "unknown",
    notes: "Ran LoL tournaments and multi-week series (2019 archive); events often at LAN King.",
    scrape: { adapter: "none", notes: "Facebook organizer — submissions from organizers preferred." },
  },
  {
    slug: "spacestation-gaming",
    name: "Spacestation Gaming",
    kind: "organizer",
    url: "https://spacestationgaming.com/",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    status: "active",
    notes: "SLC-based pro esports org (Rocket League, Rainbow Six, and more). Brand directory entry — events are international.",
    scrape: { adapter: "none", notes: "Pro org; directory listing only." },
    directory: { types: ["team"], imported: true },
  },
  {
    slug: "jazz-gaming",
    name: "Jazz Gaming (NBA 2K)",
    kind: "organizer",
    url: "https://jazzgaming.nba.co/",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    games: ["other"],
    status: "unknown",
    notes: "Utah Jazz-affiliated NBA 2K League team (2019 archive entry).",
    scrape: { adapter: "none", notes: "League team; directory listing only." },
    directory: { types: ["team"], imported: true },
  },

  // ---------------------------------------------------------------- community hubs
  {
    slug: "utah-smash-facebook",
    name: "Utah Smash (Facebook)",
    kind: "community_hub",
    url: "https://www.facebook.com/UtahSmash/",
    games: ["super-smash-brothers-ultimate", "super-smash-brothers-melee"],
    status: "unknown",
    scrape: { adapter: "none", notes: "Never scrape group content — organizer/member submissions only." },
    directory: { types: ["social_group"], imported: true, notes: "Seeded among the54 community pages." },
  },
  {
    slug: "utahs-sb-scene",
    name: "Utah's Super Smash Brothers Scene",
    kind: "community_hub",
    url: "https://www.facebook.com/Utahs-Super-Smash-Brothers-Scene-339407131402/",
    games: ["super-smash-brothers-ultimate", "super-smash-brothers-melee"],
    status: "unknown",
    scrape: { adapter: "none", notes: "No scraping — submissions only." },
    directory: { types: ["social_group"], imported: true },
  },
  {
    slug: "cache-valley-smash",
    name: "Cache Valley Smash",
    kind: "community_hub",
    url: "https://www.facebook.com/groups/Cachevalleysmash/",
    city: "Logan",
    region: "cache_valley",
    games: ["super-smash-brothers-ultimate", "super-smash-brothers-melee"],
    status: "unknown",
    scrape: { adapter: "none", notes: "No scraping — submissions only." },
    directory: { types: ["social_group"], imported: true },
  },
  {
    slug: "utah-lol-battles",
    name: "Utah League of Legends Battles",
    kind: "community_hub",
    url: "https://www.facebook.com/UtahLoLBattles/",
    games: ["league-of-legends"],
    status: "unknown",
    scrape: { adapter: "none", notes: "No scraping — submissions only." },
    directory: { types: ["social_group"], imported: true },
  },
  {
    slug: "utah-halo-club",
    name: "Utah Halo Club",
    kind: "community_hub",
    url: "https://www.facebook.com/groups/735078196619235/",
    games: ["halo-infinite"],
    status: "unknown",
    scrape: { adapter: "none", notes: "No scraping — submissions only." },
    directory: { types: ["social_group"], imported: true },
  },
  {
    slug: "utah-starcraft-players",
    name: "StarCraft II Players of Utah",
    kind: "community_hub",
    url: "https://www.facebook.com/groups/158174987527116/",
    games: ["starcraft-2"],
    status: "unknown",
    scrape: { adapter: "none", notes: "No scraping — submissions only." },
    directory: { types: ["social_group"], imported: true },
  },
  {
    slug: "utah-esports-facebook-page",
    name: "Utah Esports (Facebook page)",
    kind: "media",
    url: "https://www.facebook.com/esportsutah/",
    status: "unknown",
    notes: "The original site's Facebook page — historical announcements.",
    scrape: { adapter: "none", notes: "Page posts, not an event feed." },
  },
  {
    slug: "utah-esports-twitter",
    name: "Utah Esports (Twitter/X)",
    kind: "media",
    url: "https://twitter.com/esportsutah",
    status: "unknown",
    notes: "Original site's Twitter account.",
    scrape: { adapter: "none", notes: "Social account — directory link only." },
  },
  {
    slug: "utah-esports-instagram",
    name: "Utah Esports (Instagram)",
    kind: "media",
    url: "https://instagram.com/utahesports/",
    status: "unknown",
    notes: "Original site's Instagram account.",
    scrape: { adapter: "none", notes: "Social account — directory link only." },
  },
  {
    slug: "utah-esports-site",
    name: "utahesports.net (this site)",
    kind: "media",
    url: "https://utahesports.net/",
    status: "active",
    notes: "The directory itself — feeds calendars via /api/calendar/global.ics and embeds per-org.",
    scrape: { adapter: "none", notes: "It's us — use the JSON API /api/search instead." },
  },
];
