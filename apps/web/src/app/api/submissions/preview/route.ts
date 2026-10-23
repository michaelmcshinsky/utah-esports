import { NextResponse } from "next/server";
import { z } from "zod";
import { scrapeUrlForDraft } from "@utah-esports/scrapers";

const bodySchema = z.object({ url: z.string().url() });

/**
 * Organizers paste an event URL; we scrape it (start.gg → legacy Jekyll →
 * generic JSON-LD/h-event/meta) and return a draft to autofill the form.
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
  return NextResponse.json({
    adapter: result.adapter,
    confidence: d.confidence,
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
