import { describe, expect, it } from "vitest";
import { extractCandidateEventUrls, scanListingPage } from "./listing.js";
import { ScrapeError } from "./types.js";

describe("extractCandidateEventUrls", () => {
  const base = "https://lan-king.com/";

  it("collects schema.org Event urls (absolute and relative)", () => {
    const html = `
      <script type="application/ld+json">
        {"@type":"Event","url":"https://lan-king.com/events/smash-weekly"}
      </script>
      <script type="application/ld+json">
        {"@graph":[{"@type":"Event","url":"/events/fgc-friday"}]}
      </script>`;
    const urls = extractCandidateEventUrls(html, base);
    expect(urls).toContain("https://lan-king.com/events/smash-weekly");
    expect(urls).toContain("https://lan-king.com/events/fgc-friday");
  });

  it("collects event-ish anchors by path and text", () => {
    const html = `
      <a href="/events/lan-night">LAN Night</a>
      <a href="/tournaments/summer-cup">Summer Cup</a>
      <a href="https://www.start.gg/tournament/x">Sign up</a>
      <a href="/about">About us</a>`;
    const urls = extractCandidateEventUrls(html, base);
    expect(urls).toContain("https://lan-king.com/events/lan-night");
    expect(urls).toContain("https://lan-king.com/tournaments/summer-cup");
    expect(urls).toContain("https://www.start.gg/tournament/x");
    expect(urls.some((u) => u.includes("/about"))).toBe(false);
  });

  it("skips mailto/tel/javascript and strips fragments", () => {
    const html = `
      <a href="mailto:hi@example.com">Email</a>
      <a href="tel:8015551234">Call</a>
      <a href="javascript:void(0)">JS</a>
      <a href="/events/weekly#tickets">Weekly</a>`;
    const urls = extractCandidateEventUrls(html, base);
    expect(urls).toEqual(["https://lan-king.com/events/weekly"]);
  });

  it("returns [] for an invalid base url", () => {
    expect(extractCandidateEventUrls("<a href='/events/x'>x</a>", "not-a-url")).toEqual([]);
  });

  it("dedupes identical targets found by both heuristics", () => {
    const html = `
      <script type="application/ld+json">
        {"@type":"Event","url":"/events/dupe"}
      </script>
      <a href="/events/dupe">Tournament</a>`;
    expect(extractCandidateEventUrls(html, base)).toEqual([
      "https://lan-king.com/events/dupe",
    ]);
  });
});

describe("scanListingPage", () => {
  const html = '<a href="/events/one">Tournament</a><a href="/events/two">Weekly</a>';

  it("fetches and caps candidates by limit", async () => {
    const fetchImpl = (async () =>
      new Response(html, { status: 200 })) as unknown as typeof fetch;
    const urls = await scanListingPage("https://example.com/events", { fetchImpl, limit: 1 });
    expect(urls).toEqual(["https://example.com/events/one"]);
  });

  it("throws ScrapeError on non-ok responses", async () => {
    const fetchImpl = (async () =>
      new Response("gone", { status: 404 })) as unknown as typeof fetch;
    await expect(
      scanListingPage("https://example.com/events", { fetchImpl }),
    ).rejects.toThrow(ScrapeError);
  });

  it("wraps network failures as ScrapeError", async () => {
    const fetchImpl = (async () => {
      throw new Error("ECONNREFUSED");
    }) as unknown as typeof fetch;
    await expect(
      scanListingPage("https://example.com/events", { fetchImpl }),
    ).rejects.toThrow(/Could not fetch listing/);
  });
});
