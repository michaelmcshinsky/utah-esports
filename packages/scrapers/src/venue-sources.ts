/**
 * Best-effort Utah venue/community/event listing pages to scan for events.
 * Sourced from the 2018–2019 directory (venues.yml) and the master Utah
 * esports catalog; sites may have moved or closed — scanners tolerate
 * failures and never treat a dead link as proof a venue is gone.
 * Organizers can point the CLI at newer pages too:
 *   pnpm --filter @utah-esports/workers exec tsx scripts/import-list.ts <url>
 */
export type VenueSource = {
  name: string;
  /** Homepage or events listing to scan. */
  url: string;
  city?: string;
  kind?: "venue" | "organizer" | "convention" | "scholastic";
};

export const VENUE_SOURCE_URLS: VenueSource[] = [
  // Venues & LAN centers
  { name: "Tournament Ready Esports", url: "https://www.tournamentreadyesports.com/", city: "Salt Lake City", kind: "venue" },
  { name: "Nokto Esports", url: "https://nokto.gg/", city: "Salt Lake City", kind: "venue" },
  { name: "LAN King Gaming Lounge", url: "https://play.lanking.us/", city: "Provo", kind: "venue" },
  { name: "Game Grid", url: "https://www.playatgamegrid.com/", city: "Salt Lake City", kind: "venue" },
  { name: "Quarters Arcade Bar", url: "https://www.quartersslc.com/", city: "Salt Lake City", kind: "venue" },
  { name: "Bonus Stage Arena", url: "https://www.bonusstagearena.com/", city: "Ogden", kind: "venue" },
  { name: "Gamer Planet", url: "https://gamerplanet.net/", city: "Sandy", kind: "venue" },
  { name: "The Geekwave", url: "http://thegeekwave.com/", city: "Orem", kind: "venue" },
  { name: "GT Throne", url: "https://gtthrone.com/", city: "Salt Lake City", kind: "venue" },
  { name: "Viceroy Kicks", url: "http://viceroykicks.com/", kind: "venue" },
  { name: "GameTyrant", url: "https://www.gametyrant.com/", city: "North Salt Lake", kind: "venue" },

  // Event organizers & scholastic programs
  { name: "Ken Garff Esports Events", url: "https://www.kengarffesports.org/events", kind: "organizer" },
  { name: "Ken Garff Esports", url: "https://www.kengarffesports.org/", kind: "scholastic" },
  { name: "UHSAA", url: "https://www.uhsaa.org/", kind: "scholastic" },
  { name: "UVU Esports", url: "https://www.uvu.edu/recsports/esports/", city: "Orem", kind: "scholastic" },
  { name: "University of Utah Esports", url: "https://eae.utah.edu/esports/", city: "Salt Lake City", kind: "scholastic" },
  { name: "Utah Tech Esports", url: "https://recreation.utahtech.edu/e-sports/", city: "St. George", kind: "scholastic" },

  // Conventions & major events
  { name: "SaltCON Series", url: "https://tabletop.events/", city: "Layton", kind: "convention" },
  { name: "Utah Gaming Con", url: "https://utgamingcon.com/", city: "Sandy", kind: "convention" },
];
