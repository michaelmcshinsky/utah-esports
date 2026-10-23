import { NextResponse } from "next/server";
import { z } from "zod";
import { inArray } from "drizzle-orm";
import { scrapeUrlForDraft } from "@utah-esports/scrapers";
import { findLikelyDuplicate } from "@utah-esports/core";
import { eventOccurrences } from "@utah-esports/db";
import { db } from "@/src/lib/db";

const bodySchema = z.object({ url: z.string().url() });

/**
 * Organizers paste an event URL; we scrape it (start.gg → legacy Jekyll →
 * generic JSON-LD/h-event/meta) and return a draft to autofill the form,
 * plus a duplicate warning so likely double-posts surface before submit.
 * Nothing is persisted here — submission review still owns that.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid URL" }, { status: 400 });
  }
  const result = await scrapeUrlForDraft(parsed.data.url);
  if (result.status !== "ok") {
    return NextResponse.json(
      { error: result.error, adapter: "adapter" in result ? result.adapter : undefined },
      { status: 422 },
    );
  }
  const d = result.draft;

  // Duplicate check against existing events (same engine as the workers).
  let duplicate: { slug: string; title: string; score: number } | null = null;
  if (d.startsAt) {
    try {
      const candidates = await db()
        .select({
          id: eventOccurrences.id,
          slug: eventOccurrences.slug,
          title: eventOccurrences.title,
          startsAt: eventOccurrences.startsAt,
          city: eventOccurrences.city,
        })
        .from(eventOccurrences)
        .where(
          inArray(eventOccurrences.status, ["published", "needs_verification", "draft"]),
        )
        .limit(500);
      const match = findLikelyDuplicate(
        { title: d.title, startsAt: d.startsAt, city: d.city ?? null },
        candidates,
      );
      if (match) {
        duplicate = { slug: match.match.slug, title: match.match.title, score: match.score };
      }
    } catch {
      // Duplicate detection is best-effort; never block the preview on it.
    }
  }

  return NextResponse.json({
    adapter: result.adapter,
    confidence: d.confidence,
    duplicate,
    draft: {
      title: d.title,
      description: d.description ?? "",
      url: d.url || parsed.data.url,
      eventType: d.eventType,
      format: d.format,
      startsAt: d.startsAt ? d.startsAt.toISOString() : null,
      endsAt: d.endsAt ? d.endsAt.toISOString() : null,
      gameNames: d.gameNames.join(", "),
      city: d.city ?? "",
      priceDollars: d.priceCents != null ? (d.priceCents / 100).toFixed(2) : "",
      registrationState: d.registrationState ?? "unknown",
      contactName: d.contactName ?? "",
      contactEmail: d.contactEmail ?? "",
      venueName: d.venueName,
      source: d.source,
    },
  });
}
