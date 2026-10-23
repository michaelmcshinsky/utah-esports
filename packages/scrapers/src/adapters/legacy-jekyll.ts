import type { EventDraft } from "../types.js";
import { ScrapeError } from "../types.js";
import { inferEventMetadata } from "../infer.js";

/**
 * Legacy Jekyll adapter — parses the 2018–2019 utah-esports-website event
 * format (YAML frontmatter in Markdown) with proper metadata inference
 * (games, event type, entry price) instead of the old "all tournaments,
 * no games" import.
 *
 * URL support: GitHub blob/raw URLs for the archived repo, so future
 * imports can pull straight from the source of truth.
 */

const OWNER_REPO = /github\.com[/:]michaelmcshinsky[/:]utah-esports-website/i;

export function matchLegacyJekyllUrl(url: string): boolean {
  return OWNER_REPO.test(url) && /_events[/%2F]/.test(decodeURIComponent(url));
}

/** GitHub blob → raw.githubusercontent.com content URL. */
export function toRawUrl(url: string): string {
  const decoded = decodeURIComponent(url);
  const m = decoded.match(
    /github\.com\/michaelmcshinsky\/utah-esports-website\/blob\/([^/]+)\/(.+)$/,
  );
  if (m) {
    return `https://raw.githubusercontent.com/michaelmcshinsky/utah-esports-website/${m[1]}/${m[2]}`;
  }
  return decoded;
}

/**
 * Minimal frontmatter reader for the flat `key: value` files in _events
 * (scalars only — the format never used nested YAML).
 */
export function parseLegacyFrontmatter(content: string): {
  data: Record<string, string>;
  body: string;
} {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: content };
  const data: Record<string, string> = {};
  for (const line of (m[1] ?? "").split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    let value = (kv[2] ?? "").trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[kv[1] ?? ""] = value;
  }
  return { data, body: (m[2] ?? "").trim() };
}

/** Legacy dates are date-only (optionally with a time); default to evening MT. */
function parseLegacyDate(date?: string, time?: string, endOfDay = false): Date | null {
  if (!date) return null;
  const d = date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const parsed = new Date(d);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const t = (time ?? "").trim();
  if (/^\d{1,2}:\d{2}/.test(t)) {
    const dt = new Date(`${d}T${t.length === 5 ? `0${t}` : t}`);
    if (!Number.isNaN(dt.getTime())) {
      // Legacy times were Mountain Time; interpret in local/MT context via offset-less parse then fix to UTC-6 approx.
      return new Date(`${d}T${t}:00-07:00`);
    }
  }
  return new Date(`${d}T${endOfDay ? "23:00" : "18:00"}:00-07:00`);
}

/** Parse one legacy markdown file into a normalized draft. */
export function parseLegacyEventMarkdown(
  filename: string,
  content: string,
): EventDraft | null {
  const { data, body } = parseLegacyFrontmatter(content);
  const title = data.title?.trim();
  if (!title) return null;
  const startsAt = parseLegacyDate(data.start_date, data.start_time);
  if (!startsAt) return null;
  const endsAt = parseLegacyDate(data.end_date, data.end_time, true);

  const inferred = inferEventMetadata(title, body || data.excerpt);
  const venueName = data.venue_title?.trim() || null;
  const url = data.event_url?.trim() || data.permalink?.trim() || "";

  return {
    title,
    description: data.excerpt?.trim() || body.slice(0, 1000) || null,
    url,
    startsAt,
    endsAt,
    format: "in_person",
    city: data.venue_city?.trim() || null,
    state: data.venue_state?.trim() || "UT",
    address: [data.venue_address_1, data.venue_address_2].filter(Boolean).join(", ") || null,
    venueName,
    gameNames: inferred.gameNames,
    eventType: inferred.eventType,
    priceCents: inferred.priceCents,
    priceNote: null,
    registrationState: "unknown",
    contactName: null,
    contactEmail: null,
    agePolicy: "unknown",
    source: {
      kind: "legacy_jekyll",
      adapter: "legacy-jekyll",
      originUrl: url || filename,
      externalId: filename,
    },
    confidence: 0.85,
    raw: { filename, frontmatter: data },
  };
}

export const legacyJekyllAdapter = {
  id: "legacy-jekyll",
  label: "Legacy Jekyll site (2018–2019 events)",
  priority: 10,
  match: matchLegacyJekyllUrl,
  async scrape(url: string): Promise<EventDraft[]> {
    const raw = toRawUrl(url);
    let text: string;
    try {
      const res = await fetch(raw, { headers: { "user-agent": "utah-esports-importer/1.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      text = await res.text();
    } catch (err) {
      throw new ScrapeError(
        "legacy-jekyll",
        "network",
        `Could not fetch ${raw}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    const draft = parseLegacyEventMarkdown(raw.split("/").pop() ?? raw, text);
    return draft ? [draft] : [];
  },
};
