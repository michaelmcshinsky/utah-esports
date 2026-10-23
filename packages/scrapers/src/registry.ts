import type { EventDraft, ScrapeAdapter, ScrapeOptions } from "./types.js";
import { ScrapeError } from "./types.js";

const adapters: ScrapeAdapter[] = [];

export function registerAdapter(adapter: ScrapeAdapter): void {
  const existing = adapters.findIndex((a) => a.id === adapter.id);
  if (existing >= 0) adapters.splice(existing, 1, adapter);
  else adapters.push(adapter);
  adapters.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

export function listAdapters(): Array<{ id: string; label: string }> {
  return adapters.map((a) => ({ id: a.id, label: a.label }));
}

/** First adapter (by priority) that claims the URL, or null. */
export function getAdapterForUrl(url: string): ScrapeAdapter | null {
  for (const adapter of adapters) {
    try {
      if (adapter.match(url)) return adapter;
    } catch {
      // A broken matcher must not take down URL routing.
    }
  }
  return null;
}

export type ScrapeResult = {
  adapter: ScrapeAdapter;
  drafts: EventDraft[];
};

/**
 * Scrape an event URL with the best adapter. Throws ScrapeError with the
 * adapter id when nothing matches or the scrape fails.
 */
export async function scrapeEvent(url: string, options: ScrapeOptions = {}): Promise<ScrapeResult> {
  const adapter = getAdapterForUrl(url);
  if (!adapter) {
    throw new ScrapeError("registry", "unsupported", `No scraper matches ${url}`);
  }
  const drafts = await adapter.scrape(url, options);
  return { adapter, drafts };
}

export type ScrapeDraftResult =
  | { status: "ok"; draft: EventDraft; adapter: string }
  | { status: "no_match"; adapter?: string; error: string }
  | { status: "error"; adapter?: string; error: string };

/**
 * Convenience wrapper: scrape a URL and return the first draft as a
 * result object instead of throwing (suited to API handlers and CLIs).
 */
export async function scrapeUrlForDraft(
  url: string,
  options: ScrapeOptions = {},
): Promise<ScrapeDraftResult> {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return { status: "error", error: "Enter a full URL including https://" };
  }
  try {
    const { adapter, drafts } = await scrapeEvent(trimmed, { timeoutMs: 15_000, ...options });
    const draft = drafts[0];
    if (!draft) {
      return {
        status: "no_match",
        adapter: adapter.id,
        error: `${adapter.label} found no event data at that URL — fill the form manually.`,
      };
    }
    return { status: "ok", draft, adapter: adapter.id };
  } catch (err) {
    if (err instanceof ScrapeError) {
      return { status: "error", adapter: err.adapter, error: err.message };
    }
    return { status: "error", error: err instanceof Error ? err.message : String(err) };
  }
}
