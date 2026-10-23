import { ScrapeError, type ScrapeOptions } from "./types.js";

/**
 * Listing-page scanner: given an index page (venue site, club page, etc.)
 * extract candidate event-page URLs. Pairs with the adapter registry —
 * each candidate can then go through scrapeEvent/scrapeUrlForDraft.
 *
 * Heuristics (no per-site selectors):
 *  1. schema.org Event JSON-LD on the page (url property)
 *  2. Anchors whose path or text scream "event": /event(s)/, tournament,
 *     meetup, weekly, monthly, showdown, brackets…
 * Same-origin links are preferred but cross-origin (event platforms) kept.
 */

const EVENTISH_PATH = /\/(events?|tournaments?|tournaments?\/[^/]+|e)\/[a-z0-9._%-]+/i;
const EVENTISH_TEXT = /\b(tournament|weekly|monthly|showdown|bracket|meetup|lan\s*party|game\s*night|tryout|viewing|pubstomp|registration|sign\s*up|rsvp)\b/i;

export function extractCandidateEventUrls(html: string, baseUrl: string): string[] {
  const found = new Set<string>();
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }

  // 1. JSON-LD Event urls
  const scriptRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = scriptRe.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(m[1] ?? "") as unknown;
      collectJsonLdEventUrls(parsed, base, found);
    } catch {
      // skip unparsable blocks
    }
  }

  // 2. Event-ish anchors
  const anchorRe = /<a\s[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = anchorRe.exec(html)) !== null) {
    const href = (m[1] ?? "").trim();
    const text = (m[2] ?? "").replace(/<[^>]+>/g, " ").trim();
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:"))
      continue;
    let absolute: string;
    try {
      absolute = new URL(href, base).toString();
    } catch {
      continue;
    }
    if (!/^https?:/i.test(absolute)) continue;
    if (EVENTISH_PATH.test(absolute) || EVENTISH_TEXT.test(text)) {
      found.add(absolute.split("#")[0] ?? absolute);
    }
  }
  return [...found];
}

function collectJsonLdEventUrls(node: unknown, base: URL, out: Set<string>): void {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) collectJsonLdEventUrls(item, base, out);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  const type = obj["@type"];
  const types = Array.isArray(type) ? type.map(String) : type ? [String(type)] : [];
  if (types.some((t) => t.toLowerCase() === "event") && typeof obj.url === "string") {
    try {
      const abs = new URL(obj.url, base).toString();
      if (/^https?:/i.test(abs)) out.add(abs.split("#")[0] ?? abs);
    } catch {
      // ignore bad urls
    }
  }
  if (obj["@graph"]) collectJsonLdEventUrls(obj["@graph"], base, out);
}

/** Fetch a listing page and return candidate event URLs (capped). */
export async function scanListingPage(
  url: string,
  options: ScrapeOptions & { limit?: number } = {},
): Promise<string[]> {
  const timeout = options.timeoutMs ?? 15_000;
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
      "listing-scan",
      "network",
      `Could not fetch listing ${url}: ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    clearTimeout(timer);
  }
  const candidates = extractCandidateEventUrls(html, url);
  const limit = options.limit ?? 10;
  return candidates.slice(0, limit);
}
