import {
  StartggClient,
  fetchTournamentBySlug,
  normalizeStartggEvent,
} from "@utah-esports/startgg";
import type { EventDraft, ScrapeOptions } from "../types.js";
import { ScrapeError } from "../types.js";

/**
 * start.gg URL adapter — turns start.gg/tournament/<slug> (or /e/<id>)
 * links into normalized drafts via the official GraphQL API.
 */
const STARTGG_URL = /(?:www\.)?start\.gg\/(?:tournament|e)\/([a-z0-9-]+)/i;

export function matchStartggUrl(url: string): boolean {
  return STARTGG_URL.test(url);
}

export function extractStartggSlug(url: string): string | null {
  const m = url.match(STARTGG_URL);
  return m?.[1] ?? null;
}

export const startggUrlAdapter = {
  id: "startgg-url",
  label: "start.gg tournament URL",
  priority: 20,
  match: matchStartggUrl,
  async scrape(url: string, options: ScrapeOptions = {}): Promise<EventDraft[]> {
    const token = options.startggToken ?? process.env.STARTGG_TOKEN;
    if (!token) {
      throw new ScrapeError(
        "startgg-url",
        "auth",
        "STARTGG_TOKEN is required to import start.gg tournaments",
      );
    }
    const slug = extractStartggSlug(url);
    if (!slug) {
      throw new ScrapeError("startgg-url", "unsupported", `Could not read a slug from ${url}`);
    }
    const client = new StartggClient({
      token,
      ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
    });
    let tournament;
    try {
      tournament = await fetchTournamentBySlug(client, slug);
    } catch (err) {
      throw new ScrapeError(
        "startgg-url",
        "network",
        `start.gg query failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    if (!tournament) {
      throw new ScrapeError("startgg-url", "parse", `No start.gg tournament at slug "${slug}"`);
    }
    const normalized = normalizeStartggEvent(tournament);
    return [
      {
        title: normalized.title,
        description: null,
        url: normalized.registrationUrl,
        startsAt: normalized.startsAt,
        endsAt: normalized.endsAt,
        format: normalized.format,
        city: normalized.city,
        state: normalized.state,
        address: null,
        venueName: normalized.hostName ? null : null,
        gameNames: normalized.videogameName ? [normalized.videogameName] : [],
        eventType: "tournament",
        priceCents: null,
        priceNote: null,
        registrationState: "open",
        contactName: normalized.hostName,
        contactEmail: null,
        agePolicy: "unknown",
        source: {
          kind: "startgg",
          adapter: "startgg-url",
          originUrl: url,
          externalId: normalized.externalId,
        },
        confidence: 0.95,
        raw: tournament,
      },
    ];
  },
};
