import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { catalogSources, communities, eventOccurrences, linkChecks, getDb } from "@utah-esports/db";
import { log } from "../lib/logger.js";

/**
 * Link checks flag broken registration/community/catalog links. A single
 * failed request is NOT proof of deletion — we require consecutive failures
 * before marking a link broken, and never auto-remove listings.
 */
export async function runLinkChecks(): Promise<{ checked: number; broken: number }> {
  const db = getDb();
  const targets: Array<{ url: string; entityType: string; entityId: string | null }> = [];
  const seenUrls = new Set<string>();
  const addTarget = (url: string, entityType: string, entityId: string | null) => {
    if (!url || seenUrls.has(url)) return;
    seenUrls.add(url);
    targets.push({ url, entityType, entityId });
  };

  const since = new Date();
  since.setDate(since.getDate() - 7); // include just-started events
  const upcoming = await db
    .select({
      id: eventOccurrences.id,
      registrationUrl: eventOccurrences.registrationUrl,
    })
    .from(eventOccurrences)
    .where(
      and(
        inArray(eventOccurrences.status, ["published", "needs_verification"]),
        gte(eventOccurrences.startsAt, since),
      ),
    )
    .orderBy(asc(eventOccurrences.startsAt))
    .limit(200);
  for (const e of upcoming) {
    if (e.registrationUrl) addTarget(e.registrationUrl, "event", e.id);
  }

  const communityRows = await db
    .select({
      id: communities.id,
      discordUrl: communities.discordUrl,
      websiteUrl: communities.websiteUrl,
    })
    .from(communities)
    .where(eq(communities.status, "published"))
    .limit(50);
  for (const c of communityRows) {
    // Check both when present — a live Discord link can mask a dead site.
    if (c.discordUrl) addTarget(c.discordUrl, "community", c.id);
    if (c.websiteUrl) addTarget(c.websiteUrl, "community", c.id);
  }

  // Catalog sources: the scrape targets themselves should stay reachable;
  // the venue-scan job flips lastVerifiedAt on successful listing parses.
  const catalogRows = await db
    .select({ slug: catalogSources.slug, url: catalogSources.url })
    .from(catalogSources)
    .where(inArray(catalogSources.status, ["active", "unknown"]))
    .limit(60);
  for (const s of catalogRows) {
    // Catalog slug is text; link_checks.entity_id is uuid — the URL is the key.
    addTarget(s.url, "catalog_source", null);
  }

  let checked = 0;
  let broken = 0;
  for (const target of targets) {
    const [existing] = await db
      .select()
      .from(linkChecks)
      .where(eq(linkChecks.url, target.url))
      .limit(1);
    if (existing && existing.status === "broken" && existing.checkedAt) {
      const hours = (Date.now() - existing.checkedAt.getTime()) / 3_600_000;
      if (hours < 24) continue;
    }
    checked++;
    let status = "ok";
    let httpStatus: number | null = null;
    let notes: string | null = null;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const response = await fetch(target.url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timer);
      httpStatus = response.status;
      // Some sites reject HEAD — retry GET on 403/405.
      if (response.status === 403 || response.status === 405) {
        const getResponse = await fetch(target.url, {
          method: "GET",
          redirect: "follow",
          headers: { range: "bytes=0-0" },
        });
        httpStatus = getResponse.status;
        status = getResponse.ok || getResponse.status === 206 ? "ok" : "failing";
      } else {
        status = response.ok ? "ok" : "failing";
      }
    } catch (err) {
      status = "failing";
      notes = err instanceof Error ? err.message : String(err);
    }
    const consecutive = status === "ok" ? 0 : (existing?.consecutiveFailures ?? 0) + 1;
    const finalStatus = consecutive >= 3 ? "broken" : status;
    if (finalStatus === "broken") broken++;
    if (existing) {
      await db
        .update(linkChecks)
        .set({
          status: finalStatus,
          httpStatus,
          checkedAt: new Date(),
          consecutiveFailures: consecutive,
          notes,
          entityType: target.entityType,
          entityId: target.entityId,
        })
        .where(eq(linkChecks.id, existing.id));
    } else {
      await db.insert(linkChecks).values({
        url: target.url,
        entityType: target.entityType,
        entityId: target.entityId,
        status: finalStatus,
        httpStatus,
        checkedAt: new Date(),
        consecutiveFailures: consecutive,
        notes,
      });
    }
  }
  log("info", "link-check", "complete", { checked, broken });
  return { checked, broken };
}
