import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { asc, eq } from "drizzle-orm";
import { load as parseYaml } from "js-yaml";
import {
  getDb,
  games,
  communities,
  communityGames,
  organizations,
  teams,
  venues,
  sources,
  eventOccurrences,
  eventGames,
  redirects,
  catalogSources,
} from "../index.js";
import { SEED_GAMES, LEGACY_TAG_TO_GAME } from "./games.js";
import { geoForCity } from "./geo.js";
import { slugify, legacyEventPath } from "@utah-esports/core";
import { parseLegacyEventMarkdown, UTAH_SOURCES } from "@utah-esports/scrapers";
import { seedRbac } from "./rbac.js";

// Repo-root .env drives `pnpm db:seed` (documented in README). Absent file
// is fine — CI/hosts export DATABASE_URL directly.
const ROOT_ENV = join(import.meta.dirname, "..", "..", "..", "..", ".env");
try {
  process.loadEnvFile(ROOT_ENV);
} catch {
  // no local .env — rely on inherited environment
}

/**
 * Seeds the initial game taxonomy, placeholder organization pages for the
 * scholastic/collegiate ecosystem, and (optionally) the legacy Jekyll data.
 *
 * Everything imported from 2018–2019 content is marked with
 * source=legacy_jekyll and status=needs_verification / completed — the site
 * never presents stale data as fresh.
 */

const LEGACY_SOURCE_KEY = "legacy-jekyll-2019";

async function ensureSource(db: ReturnType<typeof getDb>, key: string, name: string, kind: "legacy_jekyll" | "manual" | "organizer" | "startgg" | "community" | "import") {
  const [existing] = await db.select().from(sources).where(eq(sources.key, key)).limit(1);
  if (existing) return existing;
  const [row] = await db
    .insert(sources)
    .values({ key, name, kind, homepage: "https://utahesports.net" })
    .returning();
  return row!;
}

export async function seedGames() {
  const db = getDb();
  for (const game of SEED_GAMES) {
    const [existing] = await db.select().from(games).where(eq(games.slug, game.slug)).limit(1);
    if (existing) continue;
    await db.insert(games).values({
      slug: game.slug,
      name: game.name,
      family: game.family ?? null,
      startggVideogameSlug: game.startggVideogameSlug ?? null,
    });
  }
  const all = await db.select().from(games).orderBy(asc(games.name));
  console.log(`seeded games: ${all.length}`);
  return all;
}

/** Scholastic/collegiate pathway placeholders — real contacts live on official sites. */
export async function seedSchoolPrograms() {
  const db = getDb();
  const programs: Array<{
    slug: string;
    name: string;
    kind: "collegiate" | "school";
    city: string;
    websiteUrl: string;
    pathway: "collegiate" | "high_school";
    institution: string;
  }> = [
    { slug: "uvu-crimson-gaming", name: "UVU Crimson Gaming", kind: "collegiate", city: "Orem", websiteUrl: "https://www.uvu.edu/recsports/esports/", pathway: "collegiate", institution: "Utah Valley University" },
    { slug: "university-of-utah-esports", name: "University of Utah Esports", kind: "collegiate", city: "Salt Lake City", websiteUrl: "https://eae.utah.edu/esports/", pathway: "collegiate", institution: "University of Utah" },
    { slug: "byu-esports", name: "BYU Esports", kind: "collegiate", city: "Provo", websiteUrl: "https://clubs.byu.edu/clubs#/esports-vgame", pathway: "collegiate", institution: "Brigham Young University" },
    { slug: "usu-esports", name: "USU Esports", kind: "collegiate", city: "Logan", websiteUrl: "https://www.usu.edu/", pathway: "collegiate", institution: "Utah State University" },
    { slug: "weber-state-claw-gaming", name: "Weber State Claw Gaming", kind: "collegiate", city: "Ogden", websiteUrl: "https://www.weber.edu/esports/", pathway: "collegiate", institution: "Weber State University" },
    { slug: "utah-tech-esports", name: "Utah Tech Esports", kind: "collegiate", city: "St. George", websiteUrl: "https://recreation.utahtech.edu/e-sports/", pathway: "collegiate", institution: "Utah Tech University" },
  ];
  for (const p of programs) {
    const [existing] = await db.select().from(organizations).where(eq(organizations.slug, p.slug)).limit(1);
    if (existing) continue;
    await db.insert(organizations).values({
      slug: p.slug,
      name: p.name,
      kind: p.kind,
      city: p.city,
      region: geoForCity(p.city)?.region ?? null,
      websiteUrl: p.websiteUrl,
      contactEmail: `esports@${p.institution.toLowerCase().replace(/[^a-z0-9]+/g, "")}.edu`,
      description: `${p.institution} esports program. Eligibility, tryouts, and official contacts are maintained by the institution.`,
    });
  }
  console.log(`seeded school programs: ${programs.length}`);
}

/** Upsert the Utah source catalog (scrapers package is the source of truth). */
export async function seedCatalog() {
  const db = getDb();
  let upserted = 0;
  for (const source of UTAH_SOURCES) {
    await db
      .insert(catalogSources)
      .values({
        slug: source.slug,
        name: source.name,
        kind: source.kind,
        url: source.url,
        city: source.city ?? null,
        region: source.region ?? null,
        games: source.games ?? [],
        status: source.status,
        scrapeAdapter: source.scrape.adapter,
        scrapeUrls: source.scrape.listingUrls ?? [],
        scrapeEvents: source.scrape.events ?? [],
        scrapeNotes: source.scrape.notes ?? null,
        directoryTypes: source.directory?.types ?? [],
        directoryImported: source.directory?.imported ?? false,
        notes: source.notes ?? null,
        lastVerifiedAt: source.status === "active" ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: catalogSources.slug,
        set: {
          name: source.name,
          kind: source.kind,
          url: source.url,
          city: source.city ?? null,
          region: source.region ?? null,
          games: source.games ?? [],
          status: source.status,
          scrapeAdapter: source.scrape.adapter,
          scrapeUrls: source.scrape.listingUrls ?? [],
          scrapeEvents: source.scrape.events ?? [],
          scrapeNotes: source.scrape.notes ?? null,
          directoryTypes: source.directory?.types ?? [],
          directoryImported: source.directory?.imported ?? false,
          notes: source.notes ?? null,
          updatedAt: new Date(),
        },
      });
    upserted++;
  }
  console.log(`catalog sources upserted: ${upserted}`);
}

type LegacyVenue = { name: string; image?: string; url?: string };
type LegacyTeam = {
  name: string;
  image?: string;
  team_name?: string;
  level?: string;
  url?: string;
  university?: string;
  facebook?: string;
  twitter?: string;
  twitch?: string;
  instagram?: string;
  discord?: string;
  youtube?: string;
};
type LegacyGroup = { name: string; url?: string; tag?: string };

function readYaml<T>(path: string): T {
  return parseYaml(readFileSync(path, "utf8")) as T;
}


function walkMarkdownFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkMarkdownFiles(full));
    else if (entry.endsWith(".md")) out.push(full);
  }
  return out;
}

/** Repo-root-relative access to the web app's public images (migrated legacy assets). */
const IMAGES_DIR = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "apps",
  "web",
  "public",
  "images",
);

function findImage(subdir: string, key: string): string | null {
  for (const ext of [".jpg", ".jpeg", ".png", ".gif", ".svg"]) {
    if (existsSync(join(IMAGES_DIR, subdir, `${key}${ext}`))) {
      return `/images/${subdir}/${key}${ext}`;
    }
  }
  return null;
}

/** Map of lowercase filename-stem → public URL for migrated event posters. */
function buildEventImageMap(): Map<string, string> {
  const dir = join(IMAGES_DIR, "events");
  const map = new Map<string, string>();
  if (!existsSync(dir)) return map;
  for (const file of readdirSync(dir)) {
    map.set(file.replace(/\.[^.]+$/, "").toLowerCase(), `/images/events/${file}`);
  }
  return map;
}

export async function seedLegacy() {
  const db = getDb();
  const legacyDir = join(import.meta.dirname, "..", "..", "seed", "legacy");
  const source = await ensureSource(db, LEGACY_SOURCE_KEY, "Utah Esports Jekyll site (2018–2019)", "legacy_jekyll");
  const now = new Date();

  // Venues ---------------------------------------------------------------
  const legacyVenues = readYaml<LegacyVenue[]>(join(legacyDir, "venues.yml"));
  let venueCount = 0;
  for (const v of legacyVenues) {
    const slug = slugify(v.name);
    const imageUrl = v.image ? findImage("vendors", v.image) : null;
    const [existing] = await db.select().from(venues).where(eq(venues.slug, slug)).limit(1);
    if (existing) {
      if (!existing.imageUrl && imageUrl) {
        await db.update(venues).set({ imageUrl }).where(eq(venues.id, existing.id));
      }
      continue;
    }
    await db.insert(venues).values({
      slug,
      name: v.name,
      websiteUrl: v.url ?? null,
      imageUrl,
      status: "needs_verification",
      sourceId: source.id,
      lastConfirmedAt: new Date("2019-06-01T00:00:00Z"),
    });
    venueCount++;
  }
  console.log(`legacy venues imported: ${venueCount}`);

  // Teams & clubs ---------------------------------------------------------
  const legacyTeams = readYaml<LegacyTeam[]>(join(legacyDir, "teams-and-clubs.yml"));
  let teamCount = 0;
  for (const t of legacyTeams) {
    const slug = slugify(t.team_name ? `${t.name} ${t.team_name}` : t.name);
    const imageUrl = t.image ? findImage("teams", t.image) : null;
    const [existing] = await db.select().from(teams).where(eq(teams.slug, slug)).limit(1);
    if (existing) {
      if (!existing.imageUrl && imageUrl) {
        await db.update(teams).set({ imageUrl }).where(eq(teams.id, existing.id));
      }
      continue;
    }
    const level = (t.level ?? "Local").toLowerCase();
    const pathway =
      level === "university" ? "collegiate" : level === "high school" ? "high_school" : "independent_team";
    const geo = geoForCity(t.name);
    await db
      .insert(teams)
      .values({
        name: t.team_name ? `${t.name} — ${t.team_name}` : t.name,
        slug,
        pathway,
        institution: level === "university" || level === "high school" ? t.name : null,
        city: geo ? t.name : null,
        websiteUrl: t.url ?? null,
        imageUrl,
        status: "needs_verification",
        sourceId: source.id,
        lastConfirmedAt: new Date("2019-06-01T00:00:00Z"),
      })
      .returning();
    teamCount++;
  }
  console.log(`legacy teams imported: ${teamCount}`);

  // Social-link refresh: the legacy yml carried Facebook/Twitch/Twitter/etc
  // per team — attach them to existing rows by slug.
  const legacyTeamsSocials = readYaml<LegacyTeam[]>(join(legacyDir, "teams-and-clubs.yml"));
  let socialsUpdated = 0;
  for (const t of legacyTeamsSocials) {
    const slug = slugify(t.team_name ? `${t.name} ${t.team_name}` : t.name);
    const [team] = await db.select().from(teams).where(eq(teams.slug, slug)).limit(1);
    if (!team) continue;
    const patch: Partial<typeof teams.$inferInsert> = {};
    if (!team.facebookUrl && t.facebook) patch.facebookUrl = t.facebook;
    if (!team.twitterUrl && t.twitter) patch.twitterUrl = t.twitter;
    if (!team.twitchUrl && t.twitch) patch.twitchUrl = t.twitch;
    if (!team.instagramUrl && t.instagram) patch.instagramUrl = t.instagram;
    if (!team.youtubeUrl && t.youtube) patch.youtubeUrl = t.youtube;
    // Discord invites from 2019 are almost certainly dead — skip re-publishing.
    if (Object.keys(patch).length > 0) {
      await db.update(teams).set(patch).where(eq(teams.id, team.id));
      socialsUpdated++;
    }
  }
  console.log(`legacy team socials refreshed: ${socialsUpdated}`);

  // Social groups → communities ------------------------------------------
  // File is a markdown-ish YAML hybrid: "## Heading" sections with list items.
  const groupsRaw = readFileSync(join(legacyDir, "social-groups.yml"), "utf8");
  const sections = groupsRaw.split(/^##\s+/m).slice(1);
  let communityCount = 0;
  const gameById = new Map((await db.select().from(games)).map((g) => [g.slug, g]));
  for (const section of sections) {
    const [heading, ...rest] = section.split("\n");
    const body = rest.join("\n");
    const items = parseYaml(body) as LegacyGroup[] | null;
    if (!Array.isArray(items)) continue;
    // Headings vary: "Super Smash Brothers", "StarCraft 2", "Dota 2"…
    const headingKey = (heading ?? "").trim().toLowerCase().replace(/\s+/g, "-");
    const gameSlug =
      LEGACY_TAG_TO_GAME[headingKey] ??
      LEGACY_TAG_TO_GAME[headingKey.split("-")[0] ?? ""] ??
      "other";
    const game = gameById.get(gameSlug) ?? gameById.get("other");
    for (const item of items) {
      if (!item?.name) continue;
      const slug = slugify(`${item.name}-${gameSlug}`);
      const [existing] = await db.select().from(communities).where(eq(communities.slug, slug)).limit(1);
      if (existing) continue;
      const [row] = await db
        .insert(communities)
        .values({
          slug,
          name: item.name,
          facebookUrl: item.url ?? null,
          status: "needs_verification",
          sourceId: source.id,
          lastConfirmedAt: new Date("2019-06-01T00:00:00Z"),
        })
        .returning();
      if (game && row) {
        await db.insert(communityGames).values({ communityId: row.id, gameId: game.id }).onConflictDoNothing();
      }
      communityCount++;
    }
  }
  console.log(`legacy communities imported: ${communityCount}`);

  // Historical events -----------------------------------------------------
  const eventsRoot = join(legacyDir, "_events");
  const files = walkMarkdownFiles(eventsRoot);
  const eventImages = buildEventImageMap();
  let eventCount = 0;
  const slugUpdates: Array<{ from: string; to: string }> = [];
  const venueRows = await db.select().from(venues);
  const venueBySlug = new Map(venueRows.map((v) => [v.slug, v]));

  /** Resolve/create a game row by display name (slugs match SEED_GAMES). */
  const resolveGameByName = async (name: string) => {
    const gameSlug = slugify(name);
    let [game] = await db.select().from(games).where(eq(games.slug, gameSlug)).limit(1);
    if (!game) {
      [game] = await db.insert(games).values({ slug: gameSlug, name }).returning();
    }
    return game ?? null;
  };

  for (const file of files) {
    try {
      const raw = readFileSync(file, "utf8");
      const filename = file.split(/[\\/]/).pop() ?? file;
      const draft = parseLegacyEventMarkdown(filename, raw);
      if (!draft?.startsAt) continue;

      // Slug date must match the legacy filename's LOCAL date, not UTC.
      const fmDate = String(
        (draft.raw as { frontmatter?: Record<string, string> } | undefined)?.frontmatter
          ?.start_date ?? "",
      ).trim();
      if (!/^\d{4}-\d{2}-\d{2}/.test(fmDate)) continue;
      const ymd = fmDate.slice(0, 10);
      const slug = `${ymd}-${slugify(draft.title)}`;
      const fileStem = filename.replace(/\.md$/i, "").toLowerCase();
      const imageUrl = eventImages.get(fileStem) ?? null;

      const [existing] = await db
        .select()
        .from(eventOccurrences)
        .where(eq(eventOccurrences.slug, slug))
        .limit(1);
      if (existing) {
        if (!existing.imageUrl && imageUrl) {
          await db.update(eventOccurrences).set({ imageUrl }).where(eq(eventOccurrences.id, existing.id));
        }
        continue;
      }

      const venueSlug = draft.venueName ? slugify(draft.venueName) : null;
      const venue = venueSlug ? venueBySlug.get(venueSlug) : undefined;
      const city = draft.city ?? venue?.city ?? null;
      const geo = geoForCity(city);
      const legacyPath = legacyEventPath(filename);

      const [row] = await db
        .insert(eventOccurrences)
        .values({
          slug,
          title: draft.title,
          description: draft.description,
          eventType: draft.eventType,
          format: "in_person",
          startsAt: draft.startsAt,
          endsAt: draft.endsAt,
          city: city ?? (venue ? venue.name : null),
          region: geo?.region ?? venue?.region ?? null,
          lat: venue?.lat ?? geo?.lat ?? null,
          lng: venue?.lng ?? geo?.lng ?? null,
          venueId: venue?.id ?? null,
          registrationUrl: draft.url || null,
          registrationState: "unknown",
          imageUrl,
          priceCents: draft.priceCents ?? null,
          status: "completed",
          sourceId: source.id,
          lastObservedAt: now,
          lastConfirmedAt: draft.startsAt,
          publishedAt: now,
        })
        .returning();
      if (row) {
        eventCount++;
        if (legacyPath.toLowerCase() !== `/events/${slug}`) {
          slugUpdates.push({ from: legacyPath, to: `/events/${slug}` });
        }
        for (const gameName of draft.gameNames) {
          const game = await resolveGameByName(gameName);
          if (game) {
            await db
              .insert(eventGames)
              .values({ eventId: row.id, gameId: game.id })
              .onConflictDoNothing();
          }
        }
        if (draft.gameNames.length === 0) {
          const other = gameById.get("other");
          if (other) {
            await db
              .insert(eventGames)
              .values({ eventId: row.id, gameId: other.id })
              .onConflictDoNothing();
          }
        }
      }
    } catch (err) {
      console.warn(`skipping ${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  console.log(`legacy events imported: ${eventCount}`);

  // Image backfill: existing legacy events → migrated posters. Stem comes
  // from the redirects table (original filename) or a direct slug match.
  const redirectRows = await db.select().from(redirects);
  const stemBySlug = new Map<string, string>();
  for (const r of redirectRows) {
    if (r.fromPath.startsWith("/events/") && r.toPath.startsWith("/events/")) {
      stemBySlug.set(
        r.toPath.slice("/events/".length),
        r.fromPath.slice("/events/".length).toLowerCase(),
      );
    }
  }
  const legacyEvents = await db
    .select({ id: eventOccurrences.id, slug: eventOccurrences.slug, imageUrl: eventOccurrences.imageUrl })
    .from(eventOccurrences)
    .where(eq(eventOccurrences.sourceId, source.id));
  let imageBackfilled = 0;
  for (const ev of legacyEvents) {
    if (ev.imageUrl) continue;
    const stem = stemBySlug.get(ev.slug) ?? (eventImages.has(ev.slug) ? ev.slug : null);
    const image = stem ? eventImages.get(stem) : null;
    if (image) {
      await db.update(eventOccurrences).set({ imageUrl: image }).where(eq(eventOccurrences.id, ev.id));
      imageBackfilled++;
    }
  }
  if (imageBackfilled > 0) {
    console.log(`legacy event images backfilled: ${imageBackfilled}`);
  }

  // Metadata refresh: legacy imports previously stamped everything
  // "tournament" with an "other" game link. Re-infer per title.
  const rowsForMeta = await db
    .select({
      id: eventOccurrences.id,
      slug: eventOccurrences.slug,
      title: eventOccurrences.title,
      description: eventOccurrences.description,
      eventType: eventOccurrences.eventType,
      priceCents: eventOccurrences.priceCents,
    })
    .from(eventOccurrences)
    .where(eq(eventOccurrences.sourceId, source.id));
  let metaUpdated = 0;
  for (const ev of rowsForMeta) {
    const draft = parseLegacyEventMarkdown(`${ev.slug}.md`, `---\ntitle: "${ev.title.replace(/"/g, "'")}"\nstart_date: ${ev.slug.slice(0, 10)}\n---\n${ev.description ?? ""}`);
    const inferred = draft
      ? { eventType: draft.eventType, gameNames: draft.gameNames, priceCents: draft.priceCents }
      : null;
    if (!inferred) continue;

    if (ev.eventType !== inferred.eventType) {
      await db
        .update(eventOccurrences)
        .set({ eventType: inferred.eventType })
        .where(eq(eventOccurrences.id, ev.id));
      metaUpdated++;
    }
    if (ev.priceCents == null && inferred.priceCents != null) {
      await db
        .update(eventOccurrences)
        .set({ priceCents: inferred.priceCents })
        .where(eq(eventOccurrences.id, ev.id));
    }

    const currentLinks = await db
      .select({ gameId: eventGames.gameId })
      .from(eventGames)
      .where(eq(eventGames.eventId, ev.id));
    const currentIds = new Set(currentLinks.map((l) => l.gameId));
    const otherId = gameById.get("other")?.id;
    const onlyOther =
      currentIds.size === 0 || (otherId !== undefined && currentIds.size === 1 && currentIds.has(otherId));
    if (inferred.gameNames.length > 0 && onlyOther) {
      if (otherId) {
        await db.delete(eventGames).where(eq(eventGames.eventId, ev.id));
      }
      for (const gameName of inferred.gameNames) {
        const game = await resolveGameByName(gameName);
        if (game) {
          await db
            .insert(eventGames)
            .values({ eventId: ev.id, gameId: game.id })
            .onConflictDoNothing();
        }
      }
      metaUpdated++;
    }
  }
  console.log(`legacy metadata refreshed: ${metaUpdated}`);

  for (const r of slugUpdates) {
    const [existing] = await db.select().from(redirects).where(eq(redirects.fromPath, r.from)).limit(1);
    if (!existing) await db.insert(redirects).values({ fromPath: r.from, toPath: r.to, statusCode: 301 });
  }
  console.log(`redirects recorded: ${slugUpdates.length}`);
}



async function main() {
  await seedRbac();
  await seedGames();
  await seedSchoolPrograms();
  await seedCatalog();
  const withLegacy = process.argv.includes("--legacy");
  if (withLegacy) await seedLegacy();
  console.log("seed complete");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
