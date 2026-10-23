import { describe, expect, it } from "vitest";
import {
  getAdapterForUrl,
  registerAdapter,
  scrapeEvent,
  scrapeUrlForDraft,
} from "./registry.js";
import type { EventDraft, ScrapeAdapter } from "./types.js";
import { ScrapeError } from "./types.js";

const draft: EventDraft = {
  title: "Test Weekly",
  url: "https://example.com/events/test-weekly",
  startsAt: new Date("2026-11-01T18:00:00Z"),
  format: "in_person",
  gameNames: ["Super Smash Bros. Ultimate"],
  eventType: "casual",
  source: { kind: "import", adapter: "test", originUrl: "https://example.com/events/test-weekly" },
  confidence: 0.8,
};

// Adapters register into module-level state for the whole file; scope each
// matcher to its own hostname so tests stay independent.
function fakeAdapter(
  host: string,
  overrides: Partial<ScrapeAdapter> & Pick<ScrapeAdapter, "id">,
): ScrapeAdapter {
  return {
    label: overrides.id,
    priority: 50,
    match: (url) => url.includes(host),
    scrape: async () => [],
    ...overrides,
  };
}

describe("registry", () => {
  it("routes by highest priority first", () => {
    registerAdapter(fakeAdapter("priority.test", { id: "low", priority: 10 }));
    registerAdapter(fakeAdapter("priority.test", { id: "high", priority: 90 }));
    expect(getAdapterForUrl("https://priority.test/x")?.id).toBe("high");
  });

  it("survives a broken matcher", () => {
    registerAdapter(
      fakeAdapter("broken.test", {
        id: "broken",
        priority: 99,
        match: () => {
          throw new Error("boom");
        },
      }),
    );
    registerAdapter(fakeAdapter("broken.test", { id: "ok", priority: 1 }));
    expect(getAdapterForUrl("https://broken.test/x")?.id).toBe("ok");
  });

  it("scrapeEvent throws unsupported when nothing matches", async () => {
    await expect(scrapeEvent("https://unsupported.test/x")).rejects.toThrow(ScrapeError);
  });

  it("scrapeUrlForDraft rejects non-http input", async () => {
    const result = await scrapeUrlForDraft("example.com/events/x");
    expect(result.status).toBe("error");
  });

  it("scrapeUrlForDraft returns no_match when the adapter finds nothing", async () => {
    registerAdapter(fakeAdapter("empty.test", { id: "empty", scrape: async () => [] }));
    const result = await scrapeUrlForDraft("https://empty.test/events/x");
    expect(result.status).toBe("no_match");
  });

  it("scrapeUrlForDraft returns the first draft on success", async () => {
    registerAdapter(fakeAdapter("ok.test", { id: "okd", scrape: async () => [draft] }));
    const result = await scrapeUrlForDraft("https://ok.test/events/x");
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.adapter).toBe("okd");
      expect(result.draft.title).toBe("Test Weekly");
    }
  });
});
