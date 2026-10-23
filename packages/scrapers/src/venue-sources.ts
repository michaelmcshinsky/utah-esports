/**
 * Best-effort Utah venue/community listing pages to scan for events.
 * Sourced from the 2018–2019 directory (venues.yml); sites may have moved
 * or closed — scanners tolerate failures and never treat a dead link as
 * proof a venue is gone. Organizers can point the CLI at newer pages too:
 *   pnpm --filter @utah-esports/workers exec tsx scripts/import-list.ts <url>
 */
export type VenueSource = {
  name: string;
  /** Homepage or events listing to scan. */
  url: string;
  city?: string;
};

export const VENUE_SOURCE_URLS: VenueSource[] = [
  { name: "Tournament Ready Esports", url: "https://www.tournamentreadyesports.com/", city: "Salt Lake City" },
  { name: "Nokto Esports", url: "https://nokto.gg/", city: "Salt Lake City" },
  { name: "LAN King", url: "http://lanking.us/", city: "Midvale" },
  { name: "Game Grid", url: "https://www.playatgamegrid.com/", city: "Salt Lake City" },
  { name: "Quarters Arcade Bar", url: "https://www.quartersslc.com/", city: "Salt Lake City" },
  { name: "Bonus Stage Arena", url: "https://www.bonusstagearena.com/", city: "Ogden" },
  { name: "Gamer Planet", url: "https://gamerplanet.net/", city: "Salt Lake City" },
  { name: "The Geekwave", url: "http://thegeekwave.com/", city: "Orem" },
  { name: "GT Throne", url: "https://gtthrone.com/", city: "Salt Lake City" },
  { name: "Viceroy Kicks", url: "http://viceroykicks.com/" },
];
