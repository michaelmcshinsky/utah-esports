import { desc, eq, inArray } from "drizzle-orm";
import { communities, eventOccurrences, linkChecks, getDb } from "@utah-esports/db";
import { log } from "../lib/logger.js";

/**
 * Link checks flag broken registration/community links. A single failed
 * request is NOT proof of deletion — we require consecutive failures before
 * marking a link broken, and never auto-remove listings.
 */
export async function runLinkChecks(): Promise<{ checked: number; broken: number }> {
  const db = getDb();
  const targets: Array<{ url: string; entityType: string; entityId: string }> = [];

  const upcoming = await db
    .select({
      id: eventOccurrences.id,
      registrationUrl: eventOccurrences.registrationUrl,
    })
    .from(eventOccurrences)
    .where(inArray(eventOccurrences.status, ["published", "needs_verification"]))
    .orderBy(desc(eventOccurrences.startsAt))
    .limit(100);
  for (const e of upcoming) {
    if (e.registrationUrl) {
      targets.push({ url: e.registrationUrl, entityType: "event", entityId: e.id });
    }
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
    const url = c.discordUrl ?? c.websiteUrl;
    if (url) targets.push({ url, entityType: "community", entityId: c.id });
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
