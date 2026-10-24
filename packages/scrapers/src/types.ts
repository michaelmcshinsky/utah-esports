import type { AgePolicy, EventType, SourceKind } from "@utah-esports/core";

/**
 * Adapter output: one normalized event draft with provenance.
 * Callers (workers/seed/preview API) own persistence; scrapers stay pure.
 */
export type EventDraft = {
  title: string;
  description?: string | null;
  /** Registration or canonical event URL (where players should go). */
  url: string;
  startsAt: Date | null;
  endsAt?: Date | null;
  format: "in_person" | "online" | "hybrid";
  city?: string | null;
  state?: string | null;
  address?: string | null;
  venueName?: string | null;
  /** Game display names — resolved against the games table by the caller. */
  gameNames: string[];
  eventType: EventType;
  priceCents?: number | null;
  priceNote?: string | null;
  registrationState?: "open" | "closed" | "unknown";
  contactName?: string | null;
  contactEmail?: string | null;
  agePolicy?: AgePolicy;
  source: {
    kind: SourceKind;
    /** Adapter id that produced this draft. */
    adapter: string;
    /** Original location the draft came from (may equal url). */
    originUrl: string;
    externalId?: string;
  };
  /** 0–1; low-confidence drafts surface first in review queues. */
  confidence: number;
  /** Banner/thumbnail image URL extracted from the source page. */
  imageUrl?: string | null;
  /** Adapter-specific original payload, kept for moderators. */
  raw?: unknown;
};

export type ScrapeOptions = {
  /** start.gg personal token when the adapter needs the API. */
  startggToken?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export type ScrapeAdapter = {
  id: string;
  label: string;
  /** Lower priority adapters run last (generic catch-alls should return high numbers). */
  priority?: number;
  match(url: string): boolean;
  scrape(url: string, options?: ScrapeOptions): Promise<EventDraft[]>;
};

export class ScrapeError extends Error {
  readonly adapter: string;
  readonly kind: "network" | "parse" | "unsupported" | "auth";

  constructor(adapter: string, kind: ScrapeError["kind"], message: string) {
    super(message);
    this.name = "ScrapeError";
    this.adapter = adapter;
    this.kind = kind;
  }
}
