import type { MetadataRoute } from "next";
import { desc, eq, inArray } from "drizzle-orm";
import { communities, eventOccurrences, games, organizations, teams, venues } from "@utah-esports/db";
import { db } from "@/src/lib/db";

export const dynamic = "force-dynamic";

/**
 * Sitemap: static routes + live DB entities. Dynamic (not build-time) so CI
 * builds succeed without a database.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3131";
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/events`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/explore`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/communities`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/places`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/schools`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/organizations`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/organizers`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/submit`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/about`, changeFrequency: "yearly", priority: 0.4 },
  ];

  try {
    const database = db();

    const [events, communityRows, venueRows, orgRows, gameRows, teamRows] = await Promise.all([
      database
        .select({
          slug: eventOccurrences.slug,
          updatedAt: eventOccurrences.updatedAt,
          startsAt: eventOccurrences.startsAt,
        })
        .from(eventOccurrences)
        .where(
          inArray(eventOccurrences.status, ["published", "postponed", "needs_verification"] as const),
        )
        .orderBy(desc(eventOccurrences.startsAt))
        .limit(1000),
      database
        .select({ slug: communities.slug, updatedAt: communities.updatedAt })
        .from(communities)
        .where(inArray(communities.status, ["published", "needs_verification"] as const))
        .limit(500),
      database
        .select({ slug: venues.slug, updatedAt: venues.updatedAt })
        .from(venues)
        .where(inArray(venues.status, ["published", "needs_verification"] as const))
        .limit(200),
      database
        .select({ slug: organizations.slug, updatedAt: organizations.updatedAt })
        .from(organizations)
        .where(eq(organizations.status, "active"))
        .limit(200),
      database.select({ slug: games.slug, name: games.name }).from(games).limit(100),
      database
        .select({ slug: teams.slug, updatedAt: teams.updatedAt })
        .from(teams)
        .where(inArray(teams.status, ["active", "needs_verification"] as const))
        .limit(200),
    ]);

    const eventRoutes: MetadataRoute.Sitemap = events
      .filter((e) => e.startsAt >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000))
      .map((e) => ({
        url: `${siteUrl}/events/${e.slug}`,
        lastModified: e.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));

    const communityRoutes: MetadataRoute.Sitemap = communityRows.map((c) => ({
      url: `${siteUrl}/communities/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const venueRoutes: MetadataRoute.Sitemap = venueRows.map((v) => ({
      url: `${siteUrl}/places/${v.slug}`,
      lastModified: v.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

    const orgRoutes: MetadataRoute.Sitemap = orgRows.map((o) => ({
      url: `${siteUrl}/organizations/${o.slug}`,
      lastModified: o.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

    const gameRoutes: MetadataRoute.Sitemap = gameRows.map((g) => ({
      url: `${siteUrl}/communities?game=${g.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    }));

    const teamRoutes: MetadataRoute.Sitemap = teamRows.map((t) => ({
      url: `${siteUrl}/teams/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

    return [
      ...staticRoutes,
      ...eventRoutes,
      ...communityRoutes,
      ...venueRoutes,
      ...orgRoutes,
      ...gameRoutes,
      ...teamRoutes,
    ];
  } catch {
    // No database at build/request time — serve the static skeleton rather
    // than a broken sitemap.
    return staticRoutes;
  }
}
