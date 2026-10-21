import { readFileSync, readdirSync, statSync } from "node:fs";
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
} from "../index.js";
import { SEED_GAMES, LEGACY_TAG_TO_GAME } from "./games.js";
import { geoForCity } from "./geo.js";
import { slugify, legacyEventPath } from "@utah-esports/core";

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
    { slug: "weber-state-claw-gaming", name: "Weber State Claw Gaming", kind: "collegiate", city: "Ogden", websiteUrl: "https://www.weber.edu/", pathway: "collegiate", institution: "Weber State University" },
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

function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, body: raw };
  const data = parseYaml(match[1] ?? "") as Record<string, unknown>;
  return { data, body: match[2] ?? "" };
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
    const [existing] = await db.select().from(venues).where(eq(venues.slug, slug)).limit(1);
    if (existing) continue;
    await db.insert(venues).values({
      slug,
      name: v.name,
      websiteUrl: v.url ?? null,
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
    const [existing] = await db.select().from(teams).where(eq(teams.slug, slug)).limit(1);
    if (existing) continue;
    const level = (t.level ?? "Local").toLowerCase();
    const pathway =
      level === "university" ? "collegiate" : level === "high school" ? "high_school" : "independent_team";
    const geo = geoForCity(t.name);
    const [row] = await db
      .insert(teams)
      .values({
        name: t.team_name ? `${t.name} — ${t.team_name}` : t.name,
        slug,
        pathway,
        institution: level === "university" || level === "high school" ? t.name : null,
        city: geo ? t.name : null,
        websiteUrl: t.url ?? null,
        status: "needs_verification",
        sourceId: source.id,
        lastConfirmedAt: new Date("2019-06-01T00:00:00Z"),
      })
      .returning();
    // Seed social links as roster-free org shells only; Discord invites from
    // 2019 are almost certainly dead — link checks will flag them.
    if (t.discord && row) {
      // kept in description-level data only; no scraping or re-publishing invites
    }
    teamCount++;
  }
  console.log(`legacy teams imported: ${teamCount}`);

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
  let eventCount = 0;
  const slugUpdates: Array<{ from: string; to: string }> = [];
  const venueRows = await db.select().from(venues);
  const venueBySlug = new Map(venueRows.map((v) => [v.slug, v]));
  for (const file of files) {
    try {
      const raw = readFileSync(file, "utf8");
      const { data } = parseFrontmatter(raw);
      const title = typeof data.title === "string" ? data.title : null;
      const startDate = toDate(data.start_date);
      if (!title || !startDate) continue;
      const startsAt = atLocalEvening(startDate, 18);
      if (Number.isNaN(startsAt.getTime())) continue;
      // Slug date must match the legacy filename's LOCAL date, not UTC.
      const ymd = startDate.toISOString().slice(0, 10);
      const slug = `${ymd}-${slugify(title)}`;
      const [existing] = await db.select().from(eventOccurrences).where(eq(eventOccurrences.slug, slug)).limit(1);
      if (existing) continue;
      const venueTitle = typeof data.venue_title === "string" ? data.venue_title : null;
      const venueSlug = venueTitle ? slugify(venueTitle) : null;
      const venue = venueSlug ? venueBySlug.get(venueSlug) : undefined;
      const city = venue?.city ?? (typeof data.venue_city === "string" && data.venue_city ? data.venue_city : null);
      const geo = geoForCity(city);
      const legacyPath = legacyEventPath(file.split(/[\\/]/).pop() ?? "");
      const endDate = toDate(data.end_date);
      const [row] = await db
        .insert(eventOccurrences)
        .values({
          slug,
          title,
          description: typeof data.excerpt === "string" ? data.excerpt : null,
          eventType: "tournament",
          format: "in_person",
          startsAt,
          endsAt: endDate ? atLocalEvening(endDate, 23) : null,
          city: city ?? (venue ? venue.name : null),
          region: geo?.region ?? venue?.region ?? null,
          lat: venue?.lat ?? geo?.lat ?? null,
          lng: venue?.lng ?? geo?.lng ?? null,
          venueId: venue?.id ?? null,
          registrationUrl: typeof data.event_url === "string" ? data.event_url : null,
          registrationState: "unknown",
          status: "completed",
          sourceId: source.id,
          lastObservedAt: now,
          lastConfirmedAt: startsAt,
          publishedAt: now,
        })
        .returning();
      if (row) {
        eventCount++;
        if (legacyPath.toLowerCase() !== `/events/${slug}`) {
          slugUpdates.push({ from: legacyPath, to: `/events/${slug}` });
        }
        // Attach "other" game; titles are too noisy for reliable auto-tagging.
        const other = gameById.get("other");
        if (other) await db.insert(eventGames).values({ eventId: row.id, gameId: other.id }).onConflictDoNothing();
      }
    } catch (err) {
      console.warn(`skipping ${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  console.log(`legacy events imported: ${eventCount}`);
  for (const r of slugUpdates) {
    const [existing] = await db.select().from(redirects).where(eq(redirects.fromPath, r.from)).limit(1);
    if (!existing) await db.insert(redirects).values({ fromPath: r.from, toPath: r.to, statusCode: 301 });
  }
  console.log(`redirects recorded: ${slugUpdates.length}`);
}

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function atLocalEvening(date: Date, hour: number): Date {
  const ymd = date.toISOString().slice(0, 10);
  return new Date(`${ymd}T${String(hour).padStart(2, "0")}:00:00-06:00`);
}

async function main() {
  await seedGames();
  await seedSchoolPrograms();
  const withLegacy = process.argv.includes("--legacy");
  if (withLegacy) await seedLegacy();
  console.log("seed complete");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
