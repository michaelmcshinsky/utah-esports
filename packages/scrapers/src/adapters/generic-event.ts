import type { EventDraft, ScrapeOptions } from "../types.js";
import { ScrapeError } from "../types.js";
import { inferEventMetadata, inferGamesFromTitle } from "../infer.js";

/**
 * Generic event-page scraper — works for any public page that exposes:
 *   1. schema.org Event JSON-LD (most event platforms / WordPress plugins)
 *   2. h-event microformats (indie event pages)
 *   3. Open Graph + event:* meta tags (last resort)
 * No per-site selectors to rot; new sites usually "just work" via (1).
 */

export function matchGenericEventUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

type JsonLd = Record<string, unknown>;

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function collectEvents(node: unknown, out: JsonLd[]): void {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) collectEvents(item, out);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as JsonLd;
  const type = obj["@type"];
  const types = Array.isArray(type) ? type.map(String) : type ? [String(type)] : [];
  if (types.some((t) => t.toLowerCase() === "event")) out.push(obj);
  if (obj["@graph"]) collectEvents(obj["@graph"], out);
}

function parseDate(v: unknown): Date | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseLocation(loc: unknown): {
  venueName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  onlineUrl: string | null;
} {
  const result = {
    venueName: null as string | null,
    address: null as string | null,
    city: null as string | null,
    state: null as string | null,
    onlineUrl: null as string | null,
  };
  if (!loc || typeof loc !== "object") return result;
  const l = loc as JsonLd;
  if (l["@type"] && String(l["@type"]).includes("VirtualLocation")) {
    result.onlineUrl = asString(l.url);
    return result;
  }
  result.venueName = asString(l.name);
  const addr = (l.address ?? l) as JsonLd;
  result.address = asString(addr.streetAddress);
  result.city = asString(addr.addressLocality);
  result.state = asString(addr.addressRegion);
  return result;
}

function parseImage(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v.length > 0) return parseImage(v[0]);
  if (v && typeof v === "object") return asString((v as JsonLd).url);
  return null;
}

export function parseJsonLdEvents(html: string, pageUrl: string): EventDraft[] {
  const drafts: EventDraft[] = [];
  const scriptRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = scriptRe.exec(html)) !== null) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(m[1] ?? "");
    } catch {
      continue;
    }
    const events: JsonLd[] = [];
    collectEvents(parsed, events);
    for (const ev of events) {
      const title = asString(ev.name);
      const startsAt = parseDate(ev.startDate);
      if (!title || !startsAt) continue;
      const endsAt = parseDate(ev.endDate);
      const location = parseLocation(ev.location);
      const attendance = asString(ev.eventAttendanceMode) ?? "";
      const online = attendance.includes("Online") || Boolean(location.onlineUrl);
      const url = asString(ev.url) ?? pageUrl;
      const offers = (ev.offers ?? null) as JsonLd | null;
      let priceCents: number | null = null;
      if (offers && typeof offers.price === "string" && offers.price.trim()) {
        const n = Number(offers.price);
        if (Number.isFinite(n)) priceCents = Math.round(n * 100);
      }
      const organizer = (ev.organizer ?? null) as JsonLd | null;
      const inferred = inferEventMetadata(title, asString(ev.description));
      const images = parseImage(ev.image);
      drafts.push({
        title,
        description: asString(ev.description),
        url,
        startsAt,
        endsAt,
        format: online ? "online" : "in_person",
        city: location.city,
        state: location.state,
        address: location.address,
        venueName: location.venueName,
        gameNames: inferred.gameNames,
        eventType: inferred.eventType,
        priceCents,
        registrationState: "unknown",
        contactName: organizer ? asString(organizer.name) : null,
        contactEmail: null,
        agePolicy: "unknown",
        source: {
          kind: "import",
          adapter: "generic-event",
          originUrl: pageUrl,
          externalId: asString(ev["@id"]) ?? asString(ev.identifier) ?? undefined,
        },
        confidence: 0.9,
        raw: { jsonLd: ev, image: images },
      });
    }
  }
  return drafts;
}

function metaContent(html: string, patterns: string[]): string | null {
  for (const pattern of patterns) {
    const re = new RegExp(pattern, "i");
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

export function parseMetaFallback(html: string, pageUrl: string): EventDraft[] {
  const title =
    metaContent(html, [
      `<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']`,
      `<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']`,
      `<title[^>]*>([^<]+)</title>`,
    ]) ?? null;
  if (!title) return [];
  const startsRaw =
    metaContent(html, [
      `<meta[^>]+property=["']event:start_time["'][^>]+content=["']([^"']+)["']`,
      `<meta[^>]+name=["']event:start_time["'][^>]+content=["']([^"']+)["']`,
      `<meta[^>]+property=["']event:start_date["'][^>]+content=["']([^"']+)["']`,
    ]) ?? null;
  const startsAt = startsRaw ? parseDate(startsRaw) : null;
  const description =
    metaContent(html, [
      `<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']`,
      `<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']`,
    ]) ?? null;
  const image =
    metaContent(html, [
      `<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']`,
    ]) ?? null;
  const city =
    metaContent(html, [
      `<meta[^>]+property=["']event:location:locality["'][^>]+content=["']([^"']+)["']`,
      `<meta[^>]+name=["']event:location["'][^>]+content=["']([^"']+)["']`,
    ]) ?? null;
  const priceRaw =
    metaContent(html, [
      `<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']`,
      `<meta[^>]+name=["']event:price["'][^>]+content=["']([^"']+)["']`,
    ]) ?? null;
  const priceCents = priceRaw && Number.isFinite(Number(priceRaw)) ? Math.round(Number(priceRaw) * 100) : null;

  const inferred = inferEventMetadata(title, description);
  return [
    {
      title: title.replace(/\s+/g, " "),
      description,
      url: pageUrl,
      startsAt,
      endsAt: null,
      format: "in_person",
      city,
      state: null,
      address: null,
      venueName: null,
      gameNames: inferGamesFromTitle(title),
      eventType: inferred.eventType,
      priceCents,
      registrationState: "unknown",
      contactName: null,
      contactEmail: null,
      agePolicy: "unknown",
      source: {
        kind: "import",
        adapter: "generic-event",
        originUrl: pageUrl,
      },
      confidence: startsAt ? 0.55 : 0.3,
      raw: { image, meta: { title, startsRaw, description } },
    },
  ];
}

function parseHEvent(html: string, pageUrl: string): EventDraft[] {
  const idx = html.search(/class=["'][^"']*\bh-event\b[^"']*["']/i);
  if (idx === -1) return [];
  const block = html.slice(idx, idx + 4000);
  const title =
    metaContent(block, [
      `<[^>]*class=["'][^"']*p-name\b[^"']*["'][^>]*>([^<]+)<`,
      `<h1[^>]*>([^<]+)</h1>`,
      `<h2[^>]*>([^<]+)</h2>`,
    ]) ?? null;
  if (!title) return [];
  const startsRaw = metaContent(block, [
    /<[^>]*class=["'][^"']*\bdt-start\b[^"']*["'][^>]*content=["']([^"']+)["']/i.source,
    /<time[^>]*class=["'][^"']*dt-start[^"']*["'][^>]*datetime=["']([^"']+)["']/i.source,
    /<[^>]*class=["'][^"']*\bdt-start\b[^"']*["'][^>]*>([^<]+)</i.source,
  ]);
  const startsAt = startsRaw ? parseDate(startsRaw) : null;
  if (!startsAt) return [];
  const location = metaContent(block, [
    /<[^>]*class=["'][^"']*\bp-location\b[^"']*["'][^>]*>([^<]+)</i.source,
  ]);
  const description = metaContent(block, [
    /<[^>]*class=["'][^"']*\b(?:p-summary|e-content)\b[^"']*["'][^>]*>([\s\S]{0,300})/i.source,
  ]);
  const priceRaw = metaContent(block, [
    /<[^>]*class=["'][^"']*\bp-price\b[^"']*["'][^>]*>([^<]+)/i.source,
    /<data[^>]*class=["'][^"']*p-price[^"']*["'][^>]*value=["']([^"']+)["']/i.source,
  ]);
  const priceCents =
    priceRaw && /\d/.test(priceRaw)
      ? Math.round(Number(priceRaw.replace(/[^\d.]/g, "")) * 100)
      : null;
  const inferred = inferEventMetadata(title, description);
  return [
    {
      title: title.replace(/\s+/g, " ").trim(),
      description: description?.trim() || null,
      url: pageUrl,
      startsAt,
      endsAt: null,
      format: "in_person",
      city: null,
      state: null,
      address: null,
      venueName: location?.trim() || null,
      gameNames: inferred.gameNames,
      eventType: inferred.eventType,
      priceCents,
      registrationState: "unknown",
      contactName: null,
      contactEmail: null,
      agePolicy: "unknown",
      source: {
        kind: "import",
        adapter: "generic-event",
        originUrl: pageUrl,
      },
      confidence: 0.65,
      raw: { hEvent: { title, startsRaw, location, priceRaw } },
    },
  ];
}

/** Parse any HTML for events using JSON-LD → h-event → meta fallbacks. */
export function parseGenericEventHtml(html: string, pageUrl: string): EventDraft[] {
  const jsonLd = parseJsonLdEvents(html, pageUrl);
  if (jsonLd.length > 0) return jsonLd;
  const hEvent = parseHEvent(html, pageUrl);
  if (hEvent.length > 0) return hEvent;
  return parseMetaFallback(html, pageUrl);
}

export const genericEventAdapter = {
  id: "generic-event",
  label: "Generic event page (JSON-LD / h-event / meta)",
  priority: 5,
  match: matchGenericEventUrl,
  async scrape(url: string, options: ScrapeOptions = {}): Promise<EventDraft[]> {
    const timeout = options.timeoutMs ?? 12_000;
    const fetchImpl = options.fetchImpl ?? fetch;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    let html: string;
    try {
      const res = await fetchImpl(url, {
        signal: controller.signal,
        headers: {
          "user-agent":
            "Mozilla/5.0 (compatible; UtahEsportsImporter/1.0; +https://utahesports.net)",
          accept: "text/html",
        },
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch (err) {
      throw new ScrapeError(
        "generic-event",
        "network",
        `Could not fetch ${url}: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      clearTimeout(timer);
    }
    return parseGenericEventHtml(html, url);
  },
};
