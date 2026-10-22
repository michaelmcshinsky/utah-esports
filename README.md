# Utah Esports

**Your next game starts here.** Find Utah tournaments, gaming communities, teams, and places to play — the new home of [utahesports.net](https://utahesports.net).

This repository is a Turborepo monorepo that replaces the archived 2018 Jekyll site (`utah-esports-website`) and its retired prototype repos. Its defining goals are **freshness, trust, and successful participation**: every listing shows where it came from, when it was last checked, and exactly what it takes to join.

## What's inside

| Path | Package | Purpose |
|---|---|---|
| `apps/web` | `@utah-esports/web` | Next.js 15 App Router — public discovery, member area, organizer dashboard, moderation console, APIs |
| `apps/workers` | `@utah-esports/workers` | Background automations: start.gg sync, freshness checks, link checks, reminders, digests, recurring generation |
| `apps/discord-bot` | `@utah-esports/discord-bot` | discord.js bot: authorized event announcements, `/events`, `/roster`, `/link`, `/roster-admin` (add/remove members, set team role) + automatic role sync loop |
| `packages/db` | `@utah-esports/db` | Drizzle schema + migrations + seeds (incl. legacy Jekyll import) |
| `packages/core` | `@utah-esports/core` | Domain enums, the single event-filter system, ICS generation, permissions, Zod schemas |
| `packages/ui` | `@utah-esports/ui` | Accessible component library + "Utah outdoors" design tokens (Tailwind v4) |
| `packages/startgg` | `@utah-esports/startgg` | Typed start.gg GraphQL client with rate limiting + normalization |
| `packages/email` | `@utah-esports/email` | Resend/console transport + digest, reminder, change, freshness templates |

## Product surfaces

- **Explore** (`/explore`) — one filter system (game, date, city, radius, type, format, skill, age, price, registration) across list, calendar, and map views; filter state lives in the URL.
- **Event pages** (`/events/[slug]`) — answer in order: what / can I participate / when+where / cost / bring / register / who to ask — plus freshness badges, cancellation notices, ICS download, save, and report.
- **Communities, Places, Schools & Teams** — connected directories, not link dumps. School pathways (collegiate / high school / youth / independent) stay separate on purpose.
- **Connected directories** — communities and venues show their **upcoming events**; event pages show the **venue** (address, BYOD) and a **related community**; public **organization pages** (`/organizations/[slug]`) aggregate an org's events, teams, claim status, and calendar.
- **Organizer dashboard** (`/dashboard`) — org creation, membership roles (owner/editor/viewer), event CRUD, recurring series (weekly cadence, safe per-night cancellation), org claims with proof links, per-org calendar feed, **embeddable calendar widget** (`/embed/calendar/[slug]`), outbound-click analytics (labeled participation proxies), one-click listing confirmation, **change history** per event, and a **link-health queue**.
- **Moderation** (`/moderation`) — submissions, claims, reports, duplicate-candidate, and **failing-link** queues with approve/reject actions; every decision writes `moderation_actions` + `audit_logs` (platform moderators only).
- **Member area** (`/account`) — preferences, saved events, saved searches (with new-match alerts), follows for events/communities/venues/games/orgs (change notifications), Discord account linking. Browsing never requires an account.

## Architecture

```
Public site / Member area / Organizer dashboard / Moderation
                      |
             Application services (Next.js)
                      |
      PostgreSQL (Supabase or docker-compose) + PostGIS image
                      |
        Durable background workers (Trigger.dev or local runner)
                      |
 start.gg · email (Resend) · Discord bot · calendar feeds (ICS)
```

Design decisions worth knowing:

- **Series vs occurrence** — `event_series` → `event_occurrences`, so one night can be cancelled without corrupting a weekly meetup.
- **Provenance is first-class** — `sources`, `source_records`, `sync_runs`, `change_records`, `duplicate_candidates`. Imports never silently merge; duplicates go to review.
- **Freshness is enforced** — stale published listings flip to `needs_verification` and owners get a confirm email. Unconfirmed data is labeled, never presented as fresh.
- **One filter implementation** — `packages/core` (`parseFilters`/`matchesFilter`/`serializeFilters`) is used by the web, the JSON API, and the digest job.
- **Discord is opt-in** — announcements post only to channels an organization explicitly authorized in the dashboard. No scraping, ever.
- **Outbound clicks are proxies** — registration/join clicks are measured (`/api/out/...`) and labeled as participation proxies, not attendance.

## Getting started

```bash
pnpm install

# Database (PostGIS image on localhost:54322)
docker compose up -d postgres

cp .env.example .env       # fill in what you have; see below

pnpm db:migrate
pnpm db:seed               # game taxonomy + school programs
pnpm db:seed:legacy        # + import 2018–2019 Jekyll content (marked needs_verification)

pnpm dev                   # turbo: web :3131, workers, bot (as configured)
```

Individual apps:

```bash
pnpm --filter @utah-esports/web dev        # http://localhost:3131
pnpm --filter @utah-esports/workers dev    # local interval scheduler
pnpm --filter @utah-esports/workers start -- --once   # run all jobs once
pnpm --filter @utah-esports/discord-bot dev
pnpm --filter @utah-esports/discord-bot register-commands
```

### Environment

Everything is documented in [`.env.example`](.env.example).

| Variable | Needed for |
|---|---|
| `DATABASE_URL` | everything DB-related |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | sign-in, follows, dashboard (site runs without it; sign-in hides) |
| `STARTGG_TOKEN` | start.gg tournament sync (skips gracefully when absent) |
| `RESEND_API_KEY` | real email (falls back to console transport) |
| `DISCORD_TOKEN` / `DISCORD_CLIENT_ID` | bot |
| `TRIGGER_SECRET_KEY` | hosted Trigger.dev schedules (optional; local runner works standalone) |

### Quality gates

```bash
pnpm lint        # ESLint 9 flat config, shared from packages/eslint-config
pnpm typecheck   # strict TypeScript across all workspaces
pnpm test        # Vitest: filters, ICS, dedupe, normalizer, UI, redirects, email
pnpm build       # Next production build (no DB required at build time)
```

CI runs all four on every PR (`.github/workflows/ci.yml`).

### Redirects

Legacy Jekyll URLs are served from two layers: hardcoded paths in `next.config.ts`
plus DB-managed rows from the `redirects` table. Regenerate the static snapshot after
adding redirects:

```bash
pnpm --filter @utah-esports/web dump-redirects   # writes apps/web/redirects.generated.json
```

## Automations

| Job | Cadence | What it does |
|---|---|---|
| `startgg-sync` | every 6h | imports Utah-window tournaments with source IDs; dedupe → review queue (moderator decisions respected on later runs) |
| `freshness-check` | daily | >45-day unconfirmed listings → `needs_verification` + owner email; one-click confirm in the dashboard |
| `link-check` | daily | HEAD/GET checks; 3 consecutive failures = broken (never auto-deletes) |
| `recurring-generation` | hourly | materializes series occurrences (capped, draft by default) |
| `deadline-reminders` | hourly | 48h-out registration deadlines, quiet hours respected, deduplicated |
| `weekly-digest` | Mondays | grounded digest from real listings, excluded cancelled, deduped per week |
| `change-notifications` | hourly | followers of the event, its org, or its games hear about material edits (48h window, quiet hours queue, per-user dedupe) |
| `saved-search-alerts` | hourly | emails when *new* events match a saved search — same filter system as the site |
| `post-event-followup` | every 2h | ends → `completed` transition + one organizer request to correct details or share a recap |

Local dev: `pnpm --filter @utah-esports/workers start` (intervals) or `-- --once`. Production: `apps/workers/src/trigger.ts` defines the same jobs as Trigger.dev scheduled tasks — the job logic itself is plain TS and runner-agnostic.

## Repository history

The old ecosystem was archived in favor of this repo:

| Old repo | Fate |
|---|---|
| `utah-esports-website` (2018 Jekyll, public) | archived — its YAML/Markdown is imported via `pnpm db:seed:legacy` |
| `utah-esports` (2021 AdonisJS) | renamed → `utah-esports-legacy-adonis`, archived |
| `utah_esports`, `utah-esports-webapp`, `utah-esports-api`, `utah-esports-strapi` | archived |
| `utah-esports-next` (empty stub) | archived (deletable once the `delete_repo` scope is granted) |

## What we deliberately don't build (yet)

Native apps, custom brackets, chat/DM, a social feed, payment processing, statewide rankings, AI-generated news, and scraping of private communities. A dependable discovery service with saved searches and calendar subscriptions comes first.

## License

MIT
