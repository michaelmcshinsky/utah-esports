import { and, asc, eq, gte, inArray, isNotNull, lte, sql } from "drizzle-orm";
import type { EventSearchFilter } from "@utah-esports/core";
import {
  communities,
  communityGames,
  eventGames,
  eventLinks,
  eventOccurrences,
  games,
  organizationMemberships,
  organizations,
  teams,
  teamMembers,
  venues,
} from "./schema/index.js";
import type { Database } from "./client.js";

/**
 * Canonical read queries shared by the web app, workers, and Discord bot.
 * Discovery must have exactly one filter implementation — this is it.
 */

const PAGE_SIZE_FALLBACK = 20;

export type EventSearchRow = typeof eventOccurrences.$inferSelect;

export type EventSearchResult = {
  items: EventSearchRow[];
  total: number;
  page: number;
  pageSize: number;
};

function haversineKm(lat: number, lng: number) {
  return sql<number>`(2 * 6371 * asin(sqrt(
    pow(sin(radians((${eventOccurrences.lat} - ${lat}) / 2)), 2) +
    cos(radians(${lat})) * cos(radians(${eventOccurrences.lat})) *
    pow(sin(radians((${eventOccurrences.lng} - ${lng}) / 2)), 2)
  )))`;
}

export async function searchEvents(
  db: Database,
  filter: EventSearchFilter,
): Promise<EventSearchResult> {
  const now = new Date();
  const conditions = [
    inArray(eventOccurrences.status, ["published", "postponed", "needs_verification"] as const),
    gte(eventOccurrences.startsAt, filter.from ? new Date(filter.from) : now),
  ];
  if (filter.to) {
    conditions.push(lte(eventOccurrences.startsAt, new Date(filter.to)));
  }
  if (filter.games.length) {
    const gameRows = await db
      .select({ id: games.id })
      .from(games)
      .where(inArray(games.slug, filter.games));
    if (gameRows.length === 0) {
      return { items: [], total: 0, page: filter.page, pageSize: filter.pageSize };
    }
    const gameIds = gameRows.map((g) => g.id);
    conditions.push(
      inArray(
        eventOccurrences.id,
        db.select({ id: eventGames.eventId }).from(eventGames).where(inArray(eventGames.gameId, gameIds)),
      ),
    );
  }
  if (filter.types.length) {
    conditions.push(inArray(eventOccurrences.eventType, filter.types as never));
  }
  if (filter.formats.length) {
    conditions.push(inArray(eventOccurrences.format, filter.formats as never));
  }
  if (filter.skills.length) {
    conditions.push(inArray(eventOccurrences.skillLevel, filter.skills as never));
  }
  if (filter.ages.length) {
    conditions.push(inArray(eventOccurrences.agePolicy, filter.ages as never));
  }
  if (filter.entryModes.length) {
    conditions.push(inArray(eventOccurrences.entryMode, filter.entryModes as never));
  }
  if (filter.registration.length) {
    conditions.push(inArray(eventOccurrences.registrationState, filter.registration as never));
  }
  if (filter.freeOnly) {
    conditions.push(sql`(${eventOccurrences.priceCents} IS NULL OR ${eventOccurrences.priceCents} = 0)`);
  }
  if (filter.beginnerOnly) {
    conditions.push(eq(eventOccurrences.beginnerFriendly, true));
  }
  if (filter.youthOnly) {
    conditions.push(eq(eventOccurrences.youthProgram, true));
  }
  if (filter.city?.length) {
    conditions.push(sql`lower(${eventOccurrences.city}) like ${`%${filter.city.toLowerCase()}%`}`);
  }
  if (filter.region?.length) {
    conditions.push(eq(eventOccurrences.region, filter.region));
  }
  if (filter.q?.length) {
    const q = `%${filter.q.toLowerCase()}%`;
    conditions.push(
      sql`(lower(${eventOccurrences.title}) like ${q} or lower(coalesce(${eventOccurrences.description}, '')) like ${q})`,
    );
  }

  const where = and(...conditions);
  const pageSize = filter.pageSize ?? PAGE_SIZE_FALLBACK;
  const offset = (filter.page - 1) * pageSize;

  const distanceExpr =
    filter.lat != null && filter.lng != null
      ? haversineKm(filter.lat, filter.lng).as("distance_km")
      : sql<null>`null`.as("distance_km");

  let orderBy;
  if (filter.sort === "distance" && filter.lat != null && filter.lng != null) {
    orderBy = [
      sql`distance_km is null`,
      sql`distance_km asc`,
      asc(eventOccurrences.startsAt),
    ];
  } else {
    orderBy = [asc(eventOccurrences.startsAt)];
  }

  const rows = await db
    .select({
      event: eventOccurrences,
      distanceKm: distanceExpr,
    })
    .from(eventOccurrences)
    .where(where)
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset(offset);

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eventOccurrences)
    .where(where);

  return {
    items: rows.map((r) => r.event),
    total: countRow?.count ?? 0,
    page: filter.page,
    pageSize,
  };
}

export async function getEventBySlug(db: Database, slug: string) {
  const [event] = await db
    .select()
    .from(eventOccurrences)
    .where(eq(eventOccurrences.slug, slug))
    .limit(1);
  return event ?? null;
}

export async function getEventGames(db: Database, eventId: string) {
  return db
    .select({ game: games })
    .from(eventGames)
    .innerJoin(games, eq(eventGames.gameId, games.id))
    .where(eq(eventGames.eventId, eventId));
}

export async function getEventLinks(db: Database, eventId: string) {
  return db.select().from(eventLinks).where(eq(eventLinks.eventId, eventId));
}

export async function listUpcomingEvents(db: Database, limit = 6) {
  return db
    .select()
    .from(eventOccurrences)
    .where(
      and(
        inArray(eventOccurrences.status, ["published", "needs_verification"] as const),
        gte(eventOccurrences.startsAt, new Date()),
      ),
    )
    .orderBy(asc(eventOccurrences.startsAt))
    .limit(limit);
}

export async function listCommunities(db: Database, opts?: { gameSlug?: string; city?: string }) {
  const rows = await db
    .select({ community: communities })
    .from(communities)
    .where(eq(communities.status, "published"))
    .orderBy(asc(communities.name));
  if (!opts?.gameSlug && !opts?.city) return rows.map((r) => r.community);
  let filtered = rows.map((r) => r.community);
  if (opts.city) {
    const city = opts.city.toLowerCase();
    filtered = filtered.filter((c) => c.city?.toLowerCase().includes(city));
  }
  if (opts.gameSlug) {
    const [game] = await db.select().from(games).where(eq(games.slug, opts.gameSlug)).limit(1);
    if (game) {
      const links = await db
        .select({ communityId: communityGames.communityId })
        .from(communityGames)
        .where(eq(communityGames.gameId, game.id));
      const ids = new Set(links.map((l) => l.communityId));
      filtered = filtered.filter((c) => ids.has(c.id));
    } else {
      filtered = [];
    }
  }
  return filtered;
}

export async function getCommunityBySlug(db: Database, slug: string) {
  const [row] = await db
    .select({ community: communities })
    .from(communities)
    .where(eq(communities.slug, slug))
    .limit(1);
  return row?.community ?? null;
}

export async function getCommunityGames(db: Database, communityId: string) {
  return db
    .select({ game: games })
    .from(communityGames)
    .innerJoin(games, eq(communityGames.gameId, games.id))
    .where(eq(communityGames.communityId, communityId));
}

export async function listVenues(db: Database) {
  return db
    .select()
    .from(venues)
    .where(eq(venues.status, "published"))
    .orderBy(asc(venues.name));
}

export async function getVenueBySlug(db: Database, slug: string) {
  const [venue] = await db.select().from(venues).where(eq(venues.slug, slug)).limit(1);
  return venue ?? null;
}

export async function listTeamsByPathway(db: Database, pathway?: string) {
  const rows = await db
    .select({ team: teams })
    .from(teams)
    .where(eq(teams.status, "active"))
    .orderBy(asc(teams.name));
  if (!pathway) return rows.map((r) => r.team);
  return rows.map((r) => r.team).filter((t) => t.pathway === pathway);
}

export async function getTeamRoster(db: Database, teamId: string) {
  return db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), isNotNull(teamMembers.joinedAt), sql`${teamMembers.leftAt} is null`))
    .orderBy(asc(teamMembers.sortWeight), asc(teamMembers.displayName));
}

export async function listOrganizations(db: Database) {
  return db.select().from(organizations).orderBy(asc(organizations.name));
}

export async function getOrganizationBySlug(db: Database, slug: string) {
  const [org] = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  return org ?? null;
}

export async function listOrgEvents(db: Database, organizationId: string, limit = 20) {
  return db
    .select()
    .from(eventOccurrences)
    .where(
      and(
        eq(eventOccurrences.organizationId, organizationId),
        inArray(eventOccurrences.status, ["published", "postponed", "needs_verification"] as const),
        gte(eventOccurrences.startsAt, new Date()),
      ),
    )
    .orderBy(asc(eventOccurrences.startsAt))
    .limit(limit);
}

export async function listEventsForSeries(db: Database, seriesId: string) {
  return db
    .select()
    .from(eventOccurrences)
    .where(eq(eventOccurrences.seriesId, seriesId))
    .orderBy(asc(eventOccurrences.startsAt));
}

export async function getMembershipsForUser(db: Database, userId: string) {
  const rows = await db
    .select()
    .from(organizationMemberships)
    .where(eq(organizationMemberships.userId, userId));
  return rows.map((m) => ({
    membershipId: m.id,
    orgId: m.organizationId,
    role: m.role,
  }));
}

export async function listGames(db: Database) {
  return db.select().from(games).orderBy(asc(games.name));
}
