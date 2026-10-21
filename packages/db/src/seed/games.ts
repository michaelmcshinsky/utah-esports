/**
 * Curated Utah-relevant game taxonomy.
 * startgg slugs are best-effort; the sync job resolves unknown videogame
 * IDs by name at runtime and writes them back.
 */

export type SeedGame = {
  slug: string;
  name: string;
  family?: string;
  startggVideogameSlug?: string;
};

export const SEED_GAMES: SeedGame[] = [
  { slug: "super-smash-brothers-ultimate", name: "Super Smash Bros. Ultimate", family: "Super Smash Bros.", startggVideogameSlug: "super-smash-brothers-ultimate" },
  { slug: "super-smash-brothers-melee", name: "Super Smash Bros. Melee", family: "Super Smash Bros.", startggVideogameSlug: "super-smash-brothers-melee" },
  { slug: "super-smash-brothers-brawl", name: "Super Smash Bros. Brawl", family: "Super Smash Bros." },
  { slug: "rocket-league", name: "Rocket League", startggVideogameSlug: "rocket-league" },
  { slug: "valorant", name: "VALORANT", startggVideogameSlug: "valorant" },
  { slug: "league-of-legends", name: "League of Legends", startggVideogameSlug: "league-of-legends" },
  { slug: "counter-strike-2", name: "Counter-Strike 2", family: "Counter-Strike", startggVideogameSlug: "counter-strike-global-offensive" },
  { slug: "apex-legends", name: "Apex Legends", startggVideogameSlug: "apex-legends" },
  { slug: "call-of-duty", name: "Call of Duty", family: "Call of Duty", startggVideogameSlug: "call-of-duty-modern-warfare-iii" },
  { slug: "fortnite", name: "Fortnite", startggVideogameSlug: "fortnite" },
  { slug: "overwatch-2", name: "Overwatch 2", family: "Overwatch", startggVideogameSlug: "overwatch-2" },
  { slug: "halo-infinite", name: "Halo Infinite", family: "Halo", startggVideogameSlug: "halo-infinite" },
  { slug: "marvel-rivals", name: "Marvel Rivals", startggVideogameSlug: "marvel-rivals" },
  { slug: "rainbow-six-siege", name: "Rainbow Six Siege", startggVideogameSlug: "rainbow-six-siege" },
  { slug: "street-fighter-6", name: "Street Fighter 6", family: "Street Fighter", startggVideogameSlug: "street-fighter-6" },
  { slug: "tekken-8", name: "Tekken 8", family: "Tekken", startggVideogameSlug: "tekken-8" },
  { slug: "guilty-gear-strive", name: "Guilty Gear -Strive-", family: "Guilty Gear", startggVideogameSlug: "guilty-gear-strive" },
  { slug: "mortal-kombat-1", name: "Mortal Kombat 1", family: "Mortal Kombat", startggVideogameSlug: "mortal-kombat-1" },
  { slug: "mario-kart-8-deluxe", name: "Mario Kart 8 Deluxe", family: "Mario Kart", startggVideogameSlug: "mario-kart-8-deluxe" },
  { slug: "pokemon-scarlet-violet", name: "Pokémon Scarlet/Violet", family: "Pokémon", startggVideogameSlug: "pokemon-scarlet-violet" },
  { slug: "team-fight-tactics", name: "Teamfight Tactics", family: "League of Legends", startggVideogameSlug: "teamfight-tactics" },
  { slug: "dota-2", name: "Dota 2", startggVideogameSlug: "dota-2" },
  { slug: "hearthstone", name: "Hearthstone", startggVideogameSlug: "hearthstone" },
  { slug: "starcraft-2", name: "StarCraft II", family: "StarCraft", startggVideogameSlug: "starcraft-2" },
  { slug: "ea-sports-fc", name: "EA Sports FC", family: "EA Sports FC", startggVideogameSlug: "ea-sports-fc-25" },
  { slug: "smash-64", name: "Super Smash Bros. 64", family: "Super Smash Bros." },
  { slug: "other", name: "Other / Misc", family: "Other" },
];

/** Legacy social-group tags → game slugs. */
export const LEGACY_TAG_TO_GAME: Record<string, string> = {
  "super-smash-brothers": "super-smash-brothers-ultimate",
  melee: "super-smash-brothers-melee",
  "league-of-legends": "league-of-legends",
  starcraft: "starcraft-2",
  halo: "halo-infinite",
  dota: "dota-2",
  hearthstone: "hearthstone",
  "counter-strike": "counter-strike-2",
  "rocket-league": "rocket-league",
  overwatch: "overwatch-2",
  fortnite: "fortnite",
  "call-of-duty": "call-of-duty",
  "destiny-2": "other",
  "battlegrounds": "other",
  warcraft: "other",
  "heroes-of-the-storm": "other",
  "final-fantasy": "other",
  pokken: "other",
  "rivals-of-aether": "other",
  "street-fighter": "street-fighter-6",
  "smash-wii-u": "super-smash-brothers-ultimate",
  "street-fighter-v": "street-fighter-6",
};
