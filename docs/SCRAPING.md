# Scraping & Source Ingestion Guide

How Utah Esports pulls event data from the wild: adapters, CLIs, scheduled jobs,
and the rules that keep imports trustworthy. The typed source catalog lives in
[`packages/scrapers/src/catalog/utah-sources.ts`](../packages/scrapers/src/catalog/utah-sources.ts)
and renders at [utahesports.net/sources](https://utahesports.net/sources)
([generated reference](./SOURCES.md)).

## Principles (non-negotiable)

1. **No private communities.** We never crawl Discord servers, private Facebook
   groups, or login-walled feeds. Organizers and members *submit* links; if a
   community wants automated distribution, they authorize it (Discord
   announcements are opt-in per channel via the dashboard).
2. **Provenance or it didn't happen.** Every imported row keeps its source key,
   external id, and origin URL (`sources` / `source_records`). Moderators can
   always trace a listing back to the scrape.
3. **Humans publish, scrapes suggest.** URL imports create **drafts** or
   submissions — a moderator reviews before anything goes public. Scheduled
   start.gg syncs are the one automated→published path, and even those route
   through duplicate review.
4. **Be a good citizen.** Respect `robots.txt`, don't hammer sites (the start.gg
   client rate-limits to ~80 req/min; listing scans hit one page per site per
   run), and prefer organizer-maintained listings over scraping whenever an
   org can claim themselves.
5. **Honest statuses.** The catalog marks sites `active` / `unknown` /
   `defunct` / `archived`. Don't pretend a dead venue is live.

## Adapter registry (`@utah-esports/scrapers`)

Adapters are priority-ordered; the first `match(url)` wins:

| Priority | Adapter | Matches | What it reads |
|---:|---|---|---|
| 20 | `startgg-url` | `start.gg/tournament/<slug>`, `start.gg/e/…` | Official GraphQL API (needs `STARTGG_TOKEN`) → normalized draft |
| 10 | `legacy-jekyll` | GitHub URLs in `michaelmcshinsky/utah-esports-website` | Markdown frontmatter via raw.githubusercontent + title inference |
| 5 | `generic-event` | any http(s) URL | schema.org **Event JSON-LD** → **h-event** microformats → `og:*`/`event:*` meta tags |

All adapters share the inference layer (`infer.ts`): title → game mapping
(Smash/Melee/RL/LoL/SF/FGC/Valorant/Halo/Fortnite…), event-type classification
(watch party / tryout / league / tournament / casual), and entry-price extraction
that ignores prize pots (`"$10 entry, $200 pot bonus"` → $10).

### Listing scanner

For index pages (venue sites, club pages) the **listing scanner**
(`listing.ts`) extracts candidate event URLs — JSON-LD `Event.url` values plus
anchors whose path or text look event-ish (`/events/`, tournament, weekly,
meetup, bracket…) — then each candidate goes through the adapter registry.

## How to import

**Single event URL** (also powers the "Fetch details from link" button on `/submit`):

```bash
pnpm --filter @utah-esports/workers exec tsx scripts/import-url.ts <event-url>
# exit 0 = draft created · 2 = likely duplicate (review before importing) · 3 = nothing parseable
```

**Whole listing page** (venue calendar, org events page):

```bash
pnpm --filter @utah-esports/workers exec tsx scripts/import-list.ts <listing-url> --limit 10
```

**start.gg tournaments near Utah**: automatic — `startgg-sync` job (every 6h)
pulls a 150-mile window around Salt Lake for configured games and upserts with
duplicate review. Set `STARTGG_TOKEN` in `.env`.

**Known venue sites**: the weekly `venue-source-scan` job (and the daily local
runner) walks `VENUE_SOURCE_URLS` + catalog listing URLs. Failures are counted,
never fatal — half of Utah's2019 web presence has moved.

## Adding a site to the catalog

1. Add a `SourceEntry` to `packages/scrapers/src/catalog/utah-sources.ts`
   (name, kind, url, status, scrape strategy, directory coverage, notes).
2. Run the seed: `pnpm db:seed` — upserts into `catalog_sources` and the
   public `/sources` page.
3. Regenerate the markdown reference:
   `pnpm --filter @utah-esports/scrapers exec tsx scripts/generate-sources-doc.ts`
4. If the site has a regular events page, add it to `scrape.listingUrls` (it
   gets picked up by the weekly scan) or `VENUE_SOURCE_URLS` for venue sites.

## Adding a new adapter

1. Create `packages/scrapers/src/adapters/<name>.ts` exporting a
   `ScrapeAdapter` (`match(url)` + `scrape(url) → EventDraft[]`), throwing
   `ScrapeError` with a clear message for auth/network/parse failures.
2. Register it in `src/index.ts` with an appropriate `priority`
   (specific platforms above the generic catch-all's `5`).
3. Add fixture-based tests (`*.test.ts`) — pure parsers preferred so they
   don't need network access.
4. Document it in the table above and in any catalog entries that use it.

## Review workflow (what happens to imports)

```
URL/scan/API → EventDraft → duplicate check → draft event or submission
                                              ↓
                              /moderation console (human review)
                                              ↓
                                  published + source_record linked
                                              ↓
                       Discord announce (authorized channels only)
```

- **Duplicates** (score ≥ 70 on title/date/city) never merge silently — they
  surface in the moderation queue and in submit-form warnings.
- **Freshness**: once live, listings age; >45 days unconfirmed →
  `needs_verification` + organizer email; one-click confirm from the dashboard.
- **Link checks** (daily) flag broken registration links after three
  consecutive failures — listings are never auto-deleted.

## Per-site cheat sheet

See [SOURCES.md](./SOURCES.md) for the full generated catalog — each entry
lists its adapter, listing URLs to scan, and site-specific notes (e.g.,
"Round One — Sandy: scan only the Sandy location page; FGC weeklies also
announced on Facebook").
