# Utah Esports — Source Catalog

> Generated from `packages/scrapers/src/catalog/utah-sources.ts` — edit that file and re-run
> `pnpm --filter @utah-esports/scrapers exec tsx scripts/generate-sources-doc.ts`.

**63 tracked sources** across 7 categories. See [SCRAPING.md](./SCRAPING.md) for how imports work.

## Event platforms

### start.gg

- **URL**: https://start.gg
- **Status**: `active`
- **Scrape**: `startgg-url`
- **How**: Official GraphQL API (STARTGG_TOKEN). Utah-window sync runs every 6h; single tournaments import from start.gg/tournament/<slug> URLs with duplicate review.
- **Games**: super-smash-brothers-ultimate, super-smash-brothers-melee, rocket-league, valorant, league-of-legends, street-fighter-6, tekken-8, mortal-kombat-1, guilty-gear-strive, mario-kart-8-deluxe, counter-strike-2, apex-legends
- **Notes**: Primary tournament platform for Utah Smash, FGC, and growing scenes.

### utah-esports-website (2018–2019 archive)

- **URL**: https://github.com/michaelmcshinsky/utah-esports-website
- **Status**: `archived`
- **Scrape**: `legacy-jekyll`
- **How**: GitHub markdown frontmatter. Fully imported: 157 events, 11 venues, 54 communities, 12 teams, with inferred games/types/prices and migrated posters.
- **Directory**: vendor, club, team, social_group — imported ✓
  - The seed of the current directory; rows are labeled needs_verification until organizers re-confirm.
- **Notes**: Historical source of truth for the original utahesports.net.

### Facebook Events (Utah gaming groups)

- **URL**: https://www.facebook.com/groups/
- **Status**: `active`
- **Scrape**: `generic-event`
- **How**: Paste a PUBLIC event URL on /submit to autofill (JSON-LD when present). Group feeds are not crawled — organizers and members submit links.
- **Directory**: social_group — imported ✓
  - Utah Smash, Utah Melee, Cache Valley Smash, Utah LoL and ~50 more groups are seeded as community pages with their group links.

### Eventbrite

- **URL**: https://www.eventbrite.com
- **Status**: `active`
- **Scrape**: `generic-event`
- **How**: Public event pages carry schema.org JSON-LD — paste the URL to import; listing scans work on organizer profile pages.

### Toornament

- **URL**: https://www.toornament.com
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **How**: Paste individual tournament URLs; JSON-LD coverage varies by organizer.

### Battlefy

- **URL**: https://battlefy.com
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **How**: Paste individual tournament URLs; confirm registration links after import.

### FACEIT

- **URL**: https://www.faceit.com
- **Status**: `active`
- **Scrape**: `generic-event`
- **How**: Used by some Utah FPS scenes; import via tournament URL paste.
- **Games**: counter-strike-2, valorant, apex-legends

### GYO

- **URL**: https://gyo.gg
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **How**: Best-effort via URL paste; links may be dead.
- **Notes**: Legacy tournament platform referenced by 2018–19 venue pages (e.g. gyo.gg/venue/lan-king). Mostly historical.

### Challonge

- **URL**: https://challonge.com
- **Status**: `active`
- **Scrape**: `none`
- **How**: Bracket hosting only; registration usually lives elsewhere.
- **Notes**: Brackets more than event calendars — used by organizers we link out to; not scraped directly.

## Venues & LAN centers

### LAN King

- **URL**: http://lanking.us/
- **Location**: Midvale (utah_valley)
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **Listing pages**: http://lanking.us/
- **How**: Long-running Midvale LAN; site + Facebook. Venue details seeded from the legacy directory.
- **Directory**: vendor — imported ✓
- **Games**: super-smash-brothers-ultimate, super-smash-brothers-melee
- **Notes**: Home of historic Smash monthlies (Smash Royale) and weeklies.

### Game Grid

- **URL**: https://www.playatgamegrid.com/
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **Listing pages**: https://www.playatgamegrid.com/
- **How**: Arcade/LAN with weekly scenes (Sandy grand opening events in 2018).
- **Directory**: vendor — imported ✓

### Quarters Arcade Bar

- **URL**: https://www.quartersslc.com/
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `active`
- **Scrape**: `generic-event`
- **Listing pages**: https://www.quartersslc.com/events, https://www.quartersslc.com/
- **How**: Bar-cade with recurring fighting-game and casual nights; site has an events calendar.
- **Directory**: vendor — imported ✓

### Nokto Esports

- **URL**: https://nokto.gg/
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **Listing pages**: https://nokto.gg/
- **How**: Ran Smash weeklies and monthly game nights (2018–19); verify the site before scanning.
- **Directory**: vendor — imported ✓
- **Games**: super-smash-brothers-ultimate, super-smash-brothers-melee

### Tournament Ready Esports

- **URL**: https://www.tournamentreadyesports.com/
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **Listing pages**: https://www.tournamentreadyesports.com/
- **Directory**: vendor — imported ✓

### Bonus Stage Arena

- **URL**: https://www.bonusstagearena.com/
- **Location**: Ogden (davis_weber)
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **Listing pages**: https://www.bonusstagearena.com/
- **Directory**: vendor — imported ✓

### Gamer Planet

- **URL**: https://gamerplanet.net/
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **Listing pages**: https://gamerplanet.net/
- **Directory**: vendor — imported ✓

### The Geekwave

- **URL**: http://thegeekwave.com/
- **Location**: Orem (utah_valley)
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **Listing pages**: http://thegeekwave.com/
- **Directory**: vendor — imported ✓

### GT Throne

- **URL**: https://gtthrone.com/
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **Listing pages**: https://gtthrone.com/
- **Directory**: vendor — imported ✓

### Viceroy Kicks

- **URL**: http://viceroykicks.com/
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **Listing pages**: http://viceroykicks.com/
- **Directory**: vendor — imported ✓

### Microsoft Store — City Creek (closed)

- **URL**: https://www.shopcitycreekcenter.com/stores/microsoft
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `defunct`
- **Scrape**: `none`
- **How**: Defunct — do not scan.
- **Directory**: vendor — imported ✓
- **Notes**: Hosted Xbox events circa 2018; Microsoft retail stores have since closed.

### Round One — Sandy

- **URL**: https://round1-us.com/
- **Location**: Sandy (salt_lake_valley)
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **Listing pages**: https://round1-us.com/locations/
- **How**: Chain site — scan only the Sandy location page; FGC weeklies also announced on Facebook.
- **Games**: street-fighter-6, tekken-8
- **Notes**: Arcade/bowling chain venue that hosted SLC fighting-game weeklies (2018 'Round 1 Sandy' events).

### GameTyrant Arcade

- **URL**: https://gametyrant.com/
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `defunct`
- **Scrape**: `none`
- **How**: Defunct — historical events only.
- **Games**: super-smash-brothers-melee, street-fighter-6, dota-2
- **Notes**: SLC arcade behind GameTyrant Melee/FGC Monthlies and Dota tournaments (2018–19). Closure reported; verify before linking.

### LAN King Gaming Lounge (LK Play)

- **URL**: https://play.lanking.us/
- **Location**: Provo (utah_valley)
- **Status**: `active`
- **Scrape**: `generic-event`
- **Listing pages**: https://play.lanking.us/, http://lanking.us/
- **How**: Premium PC/console/VR lounge. Weekly Smash Ultimate (start.gg/lkweekly or similar, Tuesdays ~7pm). Cash prizes, squads. 144 Hz hardware. X @LANKingGaming for weekly links. Address: 746 E 820 N, Provo, UT 84606. Phone: (385) 503-5464.
- **Directory**: vendor — imported ✓
- **Games**: super-smash-brothers-ultimate, super-smash-brothers-melee, street-fighter-6, tekken-8
- **Notes**: Major local hub for Provo/Utah Valley. Weekly tournaments, memberships, parties.

### Gamer Planet

- **URL**: https://gamerplanet.net/
- **Location**: Sandy (salt_lake_valley)
- **Status**: `active`
- **Scrape**: `generic-event`
- **Listing pages**: https://gamerplanet.net/
- **How**: PC + VR lounge (Oculus Quest). 60+ games, memberships, parties, local comps. GGCircuit booking system + Discord. Address: 8745 S 700 E Suite #6, Sandy.
- **Directory**: vendor — imported ✓
- **Games**: super-smash-brothers-ultimate, street-fighter-6, overwatch-2
- **Notes**: Community events via Discord.

### GameTyrant

- **URL**: https://www.gametyrant.com/
- **Location**: North Salt Lake (salt_lake_valley)
- **Status**: `active`
- **Scrape**: `generic-event`
- **Listing pages**: https://www.gametyrant.com/
- **How**: Large family-friendly LAN center (~10k sq ft). PC, console, VR. Weekly/Saturday tournaments, birthday parties, LAN parties. North Salt Lake / SLC area (~640 N Main). Site calendar + socials.
- **Directory**: vendor — imported ✓
- **Games**: super-smash-brothers-melee, street-fighter-6, dota-2, rocket-league
- **Notes**: Major local LAN center.

### Salt Palace Convention Center

- **URL**: https://www.visitsaltlake.com/meetings-and-conventions/salt-palace/
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `active`
- **Scrape**: `none`
- **How**: Host venue only — events scraped from organizers/officials (BLAST, HCS, FanX).
- **Notes**: Major convention center hosting large esports events: BLAST R6 Major (2026, $600k), Halo Championship Series Salt Lake City Majors (multiple years, $125k–$250k). Also FanX Salt Lake.

## Conventions

### FanX Salt Lake Comic Convention

- **URL**: https://fanxsaltlake.com/
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `active`
- **Scrape**: `generic-event`
- **Listing pages**: https://fanxsaltlake.com/
- **How**: Import individual panel/expo URLs; schedule pages drop JSON-LD seasonally.
- **Notes**: Major SLC convention with gaming areas and exhibitor scenes.

### Pop Con

- **URL**: https://www.facebook.com/popconsaltlake/
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **How**: Facebook-hosted announcements; paste public event URLs.
- **Notes**: Utah gaming convention (2018–19 events on the legacy site: Pop Con, Cosplay Ball).

### Salt Con

- **URL**: https://www.facebook.com/saltcon/
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **How**: Facebook-hosted; paste public event URLs.
- **Notes**: Local con with gaming tournaments (2018–19 archive).

### GAM Convention

- **URL**: https://www.facebook.com/gamutah/
- **Location**: Utah Valley (utah_valley)
- **Status**: `defunct`
- **Scrape**: `none`
- **How**: Defunct — historical only.
- **Notes**: Games-and-media convention (Jan 2019 archive).

### SaltCON Series

- **URL**: https://tabletop.events/
- **Location**: Layton (davis_weber)
- **Status**: `active`
- **Scrape**: `generic-event`
- **Listing pages**: https://tabletop.events/
- **How**: tabletop.events convention pages. Game library, tournaments, RPGs.
- **Notes**: Largest Intermountain West tabletop/RPG conventions. SaltCON Spring (Davis Conference Center, Layton, 2,000+), Summer/End of Summer, Bryce. Game library, tournaments, ProtoCON, RPGs. Supports broader gaming community.

### Utah Gaming Con

- **URL**: https://utgamingcon.com/
- **Location**: Sandy (salt_lake_valley)
- **Status**: `active`
- **Scrape**: `generic-event`
- **Listing pages**: https://utgamingcon.com/
- **How**: Official site schedule + FB.
- **Directory**: vendor — imported ✓
- **Games**: super-smash-brothers-ultimate, mario-kart-8-deluxe, pokemon-scarlet-violet
- **Notes**: Retro + TCG focused; distinct from pure esports but feeds gaming community. Retro video games, TCGs (MTG, Pokémon, Lorcana, One Piece), state championships, vendors, costumes. Annual at Mountain America Expo Center, Sandy. 2,000+ attendees.

## Scholastic & governing bodies

### UHSAA

- **URL**: https://www.uhsaa.org/
- **Status**: `active`
- **Scrape**: `none`
- **How**: Official championship info; link out, don't scrape.
- **Notes**: Utah High School Activities Association — governs sanctioned scholastic esports championships.

### PlayVS

- **URL**: https://www.playvs.com/
- **Status**: `active`
- **Scrape**: `none`
- **How**: League platform; schools list their own programs here.
- **Notes**: Season-based school league platform used by Utah schools.

### Ken Garff Esports

- **URL**: https://kengarffesports.com/
- **Status**: `active`
- **Scrape**: `generic-event`
- **How**: Scan homepage for event links; mostly registration pages.
- **Notes**: School-oriented programming and events across Utah.

### UVU Esports (Crimson Gaming)

- **URL**: https://www.uvu.edu/recsports/esports/
- **Location**: Orem (utah_valley)
- **Status**: `active`
- **Scrape**: `generic-event`
- **Listing pages**: https://www.uvu.edu/recsports/esports/
- **Directory**: team — imported ✓
  - Crimson Gaming seeded as a collegiate team/org.

### University of Utah Esports (EAE)

- **URL**: https://eae.utah.edu/esports/
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `active`
- **Scrape**: `generic-event`
- **Listing pages**: https://eae.utah.edu/esports/
- **Directory**: team — imported ✓

### BYU Esports

- **URL**: https://clubs.byu.edu/clubs#/esports-vgame
- **Location**: Provo (utah_valley)
- **Status**: `active`
- **Scrape**: `none`
- **How**: Club directory page; events surface via campus channels.
- **Directory**: team — imported ✓

### USU Esports

- **URL**: https://www.usu.edu/
- **Location**: Logan (cache_valley)
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **How**: Program pages move; verify current URL before scanning.
- **Directory**: team — imported ✓

### Weber State Esports (Claw Gaming)

- **URL**: https://www.weber.edu/
- **Location**: Ogden (davis_weber)
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **How**: Verify current program URL.
- **Directory**: team — imported ✓

### Pacific Alliance of Collegiate Gamers (PACG)

- **URL**: https://pac.gg/
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **Listing pages**: https://pac.gg/
- **Directory**: team — imported ✓
- **Notes**: Multi-school collegiate alliance with Utah members (UVU, BYU…).

### VOICE (Voice of Intercollegiate Esports)

- **URL**: https://www.voicecollegiate.org/
- **Status**: `active`
- **Scrape**: `none`
- **How**: Governance body — link only; member programs covered individually.
- **Notes**: National collegiate esports governance org. University of Utah joined in 2026.

### Utah Tech University Esports

- **URL**: https://recreation.utahtech.edu/e-sports/
- **Location**: St. George (southern_utah)
- **Status**: `active`
- **Scrape**: `generic-event`
- **Listing pages**: https://recreation.utahtech.edu/e-sports/
- **How**: Recreation page + socials/Discord. New venue announcements.
- **Directory**: team — imported ✓
- **Games**: marvel-rivals, overwatch-2, rocket-league, valorant, call-of-duty, super-smash-brothers-ultimate, league-of-legends
- **Notes**: Growing club (500+ members). Dedicated venue in Uplaza Building D (opened ~Oct 2026, 12 PCs). Titles: Marvel Rivals, Overwatch 2, Rocket League, Valorant, CoD, Smash, LoL. Instagram @utahtechesports.

### UHSAA Esports

- **URL**: https://www.uhsaa.org/
- **Status**: `active`
- **Scrape**: `none`
- **How**: Monitor UHSAA site + news releases. Download/scrape annual PDFs (e.g. EsportsStateInfo.pdf). Pair with Ken Garff for brackets. News alerts via Google/KSL.
- **Directory**: team — imported ✓
- **Games**: mario-kart-8-deluxe, super-smash-brothers-ultimate, rocket-league
- **Notes**: Officially sanctioned high school esports since 2025-26. Inaugural 2026 state champions at Weber State: Farmington (6A), Pleasant Grove (5A), Provo (4A), American Leadership (3A-1A). Games: Mario Kart 8 Deluxe, Super Smash Bros. Ultimate, Rocket League. ~80+ teams in inaugural season.

## Organizers

### No Pause Gaming

- **URL**: https://www.facebook.com/NoPauseGaming1/
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `unknown`
- **Scrape**: `none`
- **How**: Facebook organizer — submissions from organizers preferred.
- **Games**: league-of-legends
- **Notes**: Ran LoL tournaments and multi-week series (2019 archive); events often at LAN King.

### Spacestation Gaming

- **URL**: https://spacestationgaming.com/
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `active`
- **Scrape**: `none`
- **How**: Pro org; directory listing only.
- **Directory**: team — imported ✓
- **Notes**: SLC-based pro esports org (Rocket League, Rainbow Six, and more). Brand directory entry — events are international.

### Jazz Gaming (NBA 2K)

- **URL**: https://jazzgaming.nba.co/
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `unknown`
- **Scrape**: `none`
- **How**: League team; directory listing only.
- **Directory**: team — imported ✓
- **Games**: other
- **Notes**: Utah Jazz-affiliated NBA 2K League team (2019 archive entry).

### Utah Esports Council

- **URL**: https://utah-esports-council.netlify.app/
- **Status**: `active`
- **Scrape**: `generic-event`
- **Listing pages**: https://utah-esports-council.netlify.app/
- **How**: Static Netlify site — simple HTML; low change frequency.
- **Notes**: Coordinates Utah Gaming Hub (business), player engagement, and community resources.

### EDF Esports

- **URL**: https://www.edfesports.com/
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **Listing pages**: https://www.edfesports.com/
- **How**: Low volume — periodic check. Site + socials.
- **Directory**: team — imported ✓
- **Notes**: Local Utah org — local events/competitions. Activity levels vary; check site + socials (FB/Twitter/IG).

### Chaotic Convergence Gaming

- **URL**: https://chaoticconvergence.wixsite.com/ccgaming
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **Listing pages**: https://chaoticconvergence.wixsite.com/ccgaming
- **How**: Wix site scrape + Discord (manual or bot if invited). Socials.
- **Directory**: team — imported ✓
- **Notes**: Local Utah gaming/esports group. Community events and Discord activity.

### Armada GG

- **URL**: https://armada.gg/
- **Status**: `unknown`
- **Scrape**: `generic-event`
- **Listing pages**: https://armada.gg/
- **How**: Site + socials (Twitch/Twitter/IG/Discord/YouTube).
- **Directory**: team — imported ✓
- **Notes**: Local Utah org — competitive teams and streams.

### Ken Garff Esports Events

- **URL**: https://www.kengarffesports.org/events
- **Status**: `active`
- **Scrape**: `generic-event`
- **Listing pages**: https://www.kengarffesports.org/events
- **How**: WordPress-style calendar. Individual event pages have details. Google Forms for registration. Scrape events archive + individual pages.
- **Directory**: team — imported ✓
- **Games**: super-smash-brothers-ultimate, mario-kart-8-deluxe, rocket-league
- **Notes**: Regional invitationals (UVU, Utah Tech, Weber State, USU Eastern) + large statewide Spring Celebration (championships + STEAM workshops, 2,000+ students). Fall invitationals; Spring Celebration at U of U Huntsman Center.

### Ken Garff Spring Celebration

- **URL**: https://www.kengarffesports.org/events
- **Location**: Salt Lake City (salt_lake_valley)
- **Status**: `active`
- **Scrape**: `generic-event`
- **Listing pages**: https://www.kengarffesports.org/events
- **How**: Scrape events archive + individual pages. Google Forms for registration. Monitor for new invitationals.
- **Directory**: team — imported ✓
- **Games**: super-smash-brothers-ultimate, mario-kart-8-deluxe, rocket-league
- **Notes**: Dominant high school/scholastic program — 90-100+ schools across nearly every Utah district. Large statewide championship + STEAM workshops (2,000+ students). Industry guests (Shaun McBride, Nintendo alumni). Held at U of U Huntsman Center or campuses. Workshops: Tech in Finance, Arts, Manufacturing, AI, media, production.

## Community hubs

### Utah Smash (Facebook)

- **URL**: https://www.facebook.com/UtahSmash/
- **Status**: `unknown`
- **Scrape**: `none`
- **How**: Never scrape group content — organizer/member submissions only.
- **Directory**: social_group — imported ✓
  - Seeded among the54 community pages.
- **Games**: super-smash-brothers-ultimate, super-smash-brothers-melee

### Utah's Super Smash Brothers Scene

- **URL**: https://www.facebook.com/Utahs-Super-Smash-Brothers-Scene-339407131402/
- **Status**: `unknown`
- **Scrape**: `none`
- **How**: No scraping — submissions only.
- **Directory**: social_group — imported ✓
- **Games**: super-smash-brothers-ultimate, super-smash-brothers-melee

### Cache Valley Smash

- **URL**: https://www.facebook.com/groups/Cachevalleysmash/
- **Location**: Logan (cache_valley)
- **Status**: `unknown`
- **Scrape**: `none`
- **How**: No scraping — submissions only.
- **Directory**: social_group — imported ✓
- **Games**: super-smash-brothers-ultimate, super-smash-brothers-melee

### Utah League of Legends Battles

- **URL**: https://www.facebook.com/UtahLoLBattles/
- **Status**: `unknown`
- **Scrape**: `none`
- **How**: No scraping — submissions only.
- **Directory**: social_group — imported ✓
- **Games**: league-of-legends

### Utah Halo Club

- **URL**: https://www.facebook.com/groups/735078196619235/
- **Status**: `unknown`
- **Scrape**: `none`
- **How**: No scraping — submissions only.
- **Directory**: social_group — imported ✓
- **Games**: halo-infinite

### StarCraft II Players of Utah

- **URL**: https://www.facebook.com/groups/158174987527116/
- **Status**: `unknown`
- **Scrape**: `none`
- **How**: No scraping — submissions only.
- **Directory**: social_group — imported ✓
- **Games**: starcraft-2

## Media

### Utah Esports (Facebook page)

- **URL**: https://www.facebook.com/esportsutah/
- **Status**: `unknown`
- **Scrape**: `none`
- **How**: Page posts, not an event feed.
- **Notes**: The original site's Facebook page — historical announcements.

### Utah Esports (Twitter/X)

- **URL**: https://twitter.com/esportsutah
- **Status**: `unknown`
- **Scrape**: `none`
- **How**: Social account — directory link only.
- **Notes**: Original site's Twitter account.

### Utah Esports (Instagram)

- **URL**: https://instagram.com/utahesports/
- **Status**: `unknown`
- **Scrape**: `none`
- **How**: Social account — directory link only.
- **Notes**: Original site's Instagram account.

### utahesports.net (this site)

- **URL**: https://utahesports.net/
- **Status**: `active`
- **Scrape**: `none`
- **How**: It's us — use the JSON API /api/search instead.
- **Notes**: The directory itself — feeds calendars via /api/calendar/global.ics and embeds per-org.
