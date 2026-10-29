/**
 * State configuration registry — the single source of truth for each
 * state's identity, metadata, and content scope. Adding a new state means
 * adding one entry here; everything else (routes, nav, footer, SEO)
 * derives from it.
 */

export type StateConfig = {
  /** URL slug — becomes the route prefix: /[state]/... */
  slug: string;
  /** Display name: "Utah", "Colorado", … */
  name: string;
  /** Full site name for that state: "Utah Esports", "Colorado Esports", … */
  siteName: string;
  /** Tagline for that state's landing page. */
  tagline: string;
  /** SEO description. */
  description: string;
  /** Primary brand accent (hex) — used in OG images, hero gradients. */
  accentColor: string;
  /** Popular cities for the "nearest" filter and stat displays. */
  cities: string[];
  /** Games with strong scenes in this state (for the home page grid). */
  popularGames: string[];
  /** Path to hero background image. */
  heroImage: string;
  /** Path to OG share image. */
  ogImage: string;
};

export const STATES: Record<string, StateConfig> = {
  utah: {
    slug: "utah",
    name: "Utah",
    siteName: "Utah Esports",
    tagline: "Your next game starts here.",
    description:
      "Find Utah tournaments, gaming communities, teams, and places to play. Utah's home base for local esports and gaming.",
    accentColor: "#d9072a",
    cities: [
      "Salt Lake City",
      "Provo",
      "Ogden",
      "Sandy",
      "Orem",
      "Midvale",
      "St. George",
      "Logan",
      "Layton",
      "West Valley City",
    ],
    popularGames: [
      "super-smash-brothers-ultimate",
      "super-smash-brothers-melee",
      "rocket-league",
      "valorant",
      "league-of-legends",
      "street-fighter-6",
      "marvel-rivals",
      "apex-legends",
      "mario-kart-8-deluxe",
      "minecraft",
    ],
    heroImage: "/images/home/utah-esports-banner-2.jpg",
    ogImage: "/og-image.jpg",
  },
  colorado: {
    slug: "colorado",
    name: "Colorado",
    siteName: "Colorado Esports",
    tagline: "Find your game in Colorado.",
    description:
      "Find Colorado tournaments, gaming communities, teams, and places to play. Colorado's home base for local esports and gaming.",
    accentColor: "#0055ff",
    cities: [
      "Denver",
      "Colorado Springs",
      "Boulder",
      "Fort Collins",
      "Aurora",
      "Lakewood",
      "Pueblo",
      "Grand Junction",
    ],
    popularGames: [
      "super-smash-brothers-ultimate",
      "valorant",
      "rocket-league",
      "league-of-legends",
      "apex-legends",
      "counter-strike-2",
    ],
    heroImage: "/images/home/utah-esports-banner-2.jpg",
    ogImage: "/og-image.jpg",
  },
};

/** Get all state slugs for generateStaticParams. */
export function getAllStateSlugs(): string[] {
  return Object.keys(STATES);
}

/** Get a state config by slug. Returns undefined for unknown slugs. */
export function getStateConfig(slug: string): StateConfig | undefined {
  return STATES[slug];
}

/** Get the default state (first in the registry). */
export function getDefaultState(): StateConfig {
  return STATES.utah!;
}
