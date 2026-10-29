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
    /** Key events / activity this source hosts (for directory display). */
    events?: string[];
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

  // ----------------------------------------------------- additional hubs & orgs
  {
    slug: "utah-esports-council",
    name: "Utah Esports Council",
    kind: "organizer",
    url: "https://utah-esports-council.netlify.app/",
    status: "active",
    notes: "Coordinates Utah Gaming Hub (business), player engagement, and community resources.",
    scrape: { adapter: "generic-event", listingUrls: ["https://utah-esports-council.netlify.app/"], notes: "Static Netlify site — simple HTML; low change frequency." },
  },
  {
    slug: "voice",
    name: "VOICE (Voice of Intercollegiate Esports)",
    kind: "scholastic",
    url: "https://www.voicecollegiate.org/",
    status: "active",
    notes: "National collegiate esports governance org. University of Utah joined in 2026.",
    scrape: { adapter: "none", notes: "Governance body — link only; member programs covered individually." },
  },
  {
    slug: "utah-tech-esports",
    name: "Utah Tech University Esports",
    kind: "scholastic",
    url: "https://recreation.utahtech.edu/e-sports/",
    city: "St. George",
    region: "southern_utah",
    games: ["marvel-rivals", "overwatch-2", "rocket-league", "valorant", "call-of-duty", "super-smash-brothers-ultimate", "league-of-legends"],
    status: "active",
    notes: "Growing club (500+ members). Dedicated venue in Uplaza Building D (opened ~Oct 2026, 12 PCs). Titles: Marvel Rivals, Overwatch 2, Rocket League, Valorant, CoD, Smash, LoL. Instagram @utahtechesports.",
    scrape: { adapter: "generic-event", listingUrls: ["https://recreation.utahtech.edu/e-sports/"], notes: "Recreation page + socials/Discord. New venue announcements." },
    directory: { types: ["team"], imported: true },
  },

  // ----------------------------------------------------- additional pro/orgs
  {
    slug: "edf-esports",
    name: "EDF Esports",
    kind: "organizer",
    url: "https://www.edfesports.com/",
    status: "unknown",
    notes: "Local Utah org — local events/competitions. Activity levels vary; check site + socials (FB/Twitter/IG).",
    scrape: { adapter: "generic-event", listingUrls: ["https://www.edfesports.com/"], notes: "Low volume — periodic check. Site + socials." },
    directory: { types: ["team"], imported: true },
  },
  {
    slug: "chaotic-convergence-gaming",
    name: "Chaotic Convergence Gaming",
    kind: "organizer",
    url: "https://chaoticconvergence.wixsite.com/ccgaming",
    status: "unknown",
    notes: "Local Utah gaming/esports group. Community events and Discord activity.",
    scrape: { adapter: "generic-event", listingUrls: ["https://chaoticconvergence.wixsite.com/ccgaming"], notes: "Wix site scrape + Discord (manual or bot if invited). Socials." },
    directory: { types: ["team"], imported: true },
  },
  {
    slug: "armada-gg",
    name: "Armada GG",
    kind: "organizer",
    url: "https://armada.gg/",
    status: "unknown",
    notes: "Local Utah org — competitive teams and streams.",
    scrape: { adapter: "generic-event", listingUrls: ["https://armada.gg/"], notes: "Site + socials (Twitch/Twitter/IG/Discord/YouTube)." },
    directory: { types: ["team"], imported: true },
  },
  {
    slug: "ken-garff-events",
    name: "Ken Garff Esports Events",
    kind: "organizer",
    url: "https://www.kengarffesports.org/events",
    status: "active",
    games: ["super-smash-brothers-ultimate", "mario-kart-8-deluxe", "rocket-league"],
    notes: "Regional invitationals (UVU, Utah Tech, Weber State, USU Eastern) + large statewide Spring Celebration (championships + STEAM workshops, 2,000+ students). Fall invitationals; Spring Celebration at U of U Huntsman Center.",
    scrape: {
      adapter: "generic-event",
      listingUrls: ["https://www.kengarffesports.org/events"],
      notes: "WordPress-style calendar. Individual event pages have details. Google Forms for registration. Scrape events archive + individual pages.",
    },
    directory: { types: ["team"], imported: true },
  },
  {
    slug: "uhsaa-esports",
    name: "UHSAA Esports",
    kind: "scholastic",
    url: "https://www.uhsaa.org/",
    status: "active",
    games: ["mario-kart-8-deluxe", "super-smash-brothers-ultimate", "rocket-league"],
    notes: "Officially sanctioned high school esports since 2025-26. Inaugural 2026 state champions at Weber State: Farmington (6A), Pleasant Grove (5A), Provo (4A), American Leadership (3A-1A). Games: Mario Kart 8 Deluxe, Super Smash Bros. Ultimate, Rocket League. ~80+ teams in inaugural season.",
    scrape: {
      adapter: "none",
      notes: "Monitor UHSAA site + news releases. Download/scrape annual PDFs (e.g. EsportsStateInfo.pdf). Pair with Ken Garff for brackets. News alerts via Google/KSL.",
    },
    directory: { types: ["team"], imported: true },
  },

  // ----------------------------------------------------- venue updates (master list addresses)
  {
    slug: "lan-king-gaming-lounge",
    name: "LAN King Gaming Lounge (LK Play)",
    kind: "venue",
    url: "https://play.lanking.us/",
    city: "Provo",
    region: "utah_valley",
    games: ["super-smash-brothers-ultimate", "super-smash-brothers-melee", "street-fighter-6", "tekken-8"],
    status: "active",
    scrape: {
      adapter: "generic-event",
      listingUrls: ["https://play.lanking.us/", "http://lanking.us/"],
      notes: "Premium PC/console/VR lounge. Weekly Smash Ultimate (start.gg/lkweekly or similar, Tuesdays ~7pm). Cash prizes, squads. 144 Hz hardware. X @LANKingGaming for weekly links. Address: 746 E 820 N, Provo, UT 84606. Phone: (385) 503-5464.",
    },
    directory: { types: ["vendor"], imported: true },
    notes: "Major local hub for Provo/Utah Valley. Weekly tournaments, memberships, parties.",
  },
  {
    slug: "gamer-planet-sandy",
    name: "Gamer Planet",
    kind: "venue",
    url: "https://gamerplanet.net/",
    city: "Sandy",
    region: "salt_lake_valley",
    games: ["super-smash-brothers-ultimate", "street-fighter-6", "overwatch-2"],
    status: "active",
    scrape: {
      adapter: "generic-event",
      listingUrls: ["https://gamerplanet.net/"],
      notes: "PC + VR lounge (Oculus Quest). 60+ games, memberships, parties, local comps. GGCircuit booking system + Discord. Address: 8745 S 700 E Suite #6, Sandy.",
    },
    directory: { types: ["vendor"], imported: true },
    notes: "Community events via Discord.",
  },
  {
    slug: "gamet-yrant-lan-center",
    name: "GameTyrant",
    kind: "venue",
    url: "https://www.gametyrant.com/",
    city: "North Salt Lake",
    region: "salt_lake_valley",
    games: ["super-smash-brothers-melee", "street-fighter-6", "dota-2", "rocket-league"],
    status: "active",
    scrape: {
      adapter: "generic-event",
      listingUrls: ["https://www.gametyrant.com/"],
      notes: "Large family-friendly LAN center (~10k sq ft). PC, console, VR. Weekly/Saturday tournaments, birthday parties, LAN parties. North Salt Lake / SLC area (~640 N Main). Site calendar + socials.",
    },
    directory: { types: ["vendor"], imported: true },
    notes: "Major local LAN center.",
  },

  // ----------------------------------------------------- convention updates
  {
    slug: "saltcon-series",
    name: "SaltCON Series",
    kind: "convention",
    url: "https://tabletop.events/",
    city: "Layton",
    region: "davis_weber",
    status: "active",
    notes: "Largest Intermountain West tabletop/RPG conventions. SaltCON Spring (Davis Conference Center, Layton, 2,000+), Summer/End of Summer, Bryce. Game library, tournaments, ProtoCON, RPGs. Supports broader gaming community.",
    scrape: {
      adapter: "generic-event",
      listingUrls: ["https://tabletop.events/"],
      events: ["SaltCON Spring (Davis Conference Center, Layton, 2,000+ attendees)", "SaltCON Summer", "SaltCON End of Summer", "SaltCON Bryce", "ProtoCON"],
      notes: "tabletop.events convention pages. Game library, tournaments, RPGs.",
    },
  },
  {
    slug: "utah-gaming-con",
    name: "Utah Gaming Con",
    kind: "convention",
    url: "https://utgamingcon.com/",
    city: "Sandy",
    region: "salt_lake_valley",
    games: ["super-smash-brothers-ultimate", "mario-kart-8-deluxe", "pokemon-scarlet-violet"],
    status: "active",
    notes: "Retro + TCG focused; distinct from pure esports but feeds gaming community. Retro video games, TCGs (MTG, Pokémon, Lorcana, One Piece), state championships, vendors, costumes. Annual at Mountain America Expo Center, Sandy. 2,000+ attendees.",
    scrape: {
      adapter: "generic-event",
      listingUrls: ["https://utgamingcon.com/"],
      events: ["Utah Gaming Con (annual, Mountain America Expo Center, Sandy)", "TCG state championships", "Retro gaming tournaments"],
      notes: "Official site schedule + FB.",
    },
    directory: { types: ["vendor"], imported: true },
  },
  {
    slug: "salt-palace-events",
    name: "Salt Palace Convention Center",
    kind: "venue",
    url: "https://www.visitsaltlake.com/meetings-and-conventions/salt-palace/",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    status: "active",
    notes: "Major convention center hosting large esports events: BLAST R6 Major (2026, $600k), Halo Championship Series Salt Lake City Majors (multiple years, $125k–$250k). Also FanX Salt Lake.",
    scrape: { adapter: "none", notes: "Host venue only — events scraped from organizers/officials (BLAST, HCS, FanX)." },
  },

  // ----------------------------------------------------- event sources
  {
    slug: "ken-garff-spring-celebration",
    name: "Ken Garff Spring Celebration",
    kind: "organizer",
    url: "https://www.kengarffesports.org/events",
    city: "Salt Lake City",
    region: "salt_lake_valley",
    games: ["super-smash-brothers-ultimate", "mario-kart-8-deluxe", "rocket-league"],
    status: "active",
    notes: "Dominant high school/scholastic program — 90-100+ schools across nearly every Utah district. Large statewide championship + STEAM workshops (2,000+ students). Industry guests (Shaun McBride, Nintendo alumni). Held at U of U Huntsman Center or campuses. Workshops: Tech in Finance, Arts, Manufacturing, AI, media, production.",
    scrape: {
      adapter: "generic-event",
      listingUrls: ["https://www.kengarffesports.org/events"],
      events: ["Spring Celebration (April, Huntsman Center)", "Championships (Mario Kart 8 Deluxe, Smash Ultimate, Rocket League)", "STEAM Workshops (coding, AI, production)", "Advisor Kick-Off", "UVU Invitational (Oct 30 2026)", "Utah Tech Invitational (Nov 20)", "Weber State Invitational (Dec 1)"],
      notes: "Scrape events archive + individual pages. Google Forms for registration. Monitor for new invitationals.",
    },
    directory: { types: ["team"], imported: true },
  },
];
