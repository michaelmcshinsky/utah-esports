import { describe, expect, it } from "vitest";
import { parseJsonLdEvents, parseMetaFallback, parseGenericEventHtml } from "./adapters/generic-event.js";
import { extractStartggSlug, matchStartggUrl } from "./adapters/startgg-url.js";
import { matchLegacyJekyllUrl, toRawUrl } from "./adapters/legacy-jekyll.js";
import { getAdapterForUrl } from "./registry.js";
import { extractCandidateEventUrls, scanListingPage } from "./listing.js";
import "./index.js"; // registers built-in adapters

const JSONLD_HTML = `<!doctype html><html><head>
<title>Smash Weekly | LAN King</title>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Utah Smash Weekly",
  "description": "Weekly Ultimate bracket",
  "startDate": "2026-11-07T19:00:00-07:00",
  "endDate": "2026-11-07T23:00:00-07:00",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "LAN King",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 W Center St",
      "addressLocality": "Midvale",
      "addressRegion": "UT"
    }
  },
  "offers": { "@type": "Offer", "price": "10.00", "priceCurrency": "USD" },
  "organizer": { "@type": "Organization", "name": "Utah Smash" }
}
</script></head><body></body></html>`;

const META_HTML = `<!doctype html><html><head>
<meta property="og:title" content="Rocket League Night at Quarters" />
<meta property="og:description" content="Casual 3v3s all night" />
<meta property="event:start_time" content="2026-12-01T20:00:00-07:00" />
<meta property="event:location:locality" content="Ogden" />
<meta property="product:price:amount" content="5" />
<title>Rocket League Night at Quarters</title>
</head><body></body></html>`;

describe("parseJsonLdEvents", () => {
  it("extracts a schema.org Event with venue, price, organizer", () => {
    const drafts = parseJsonLdEvents(JSONLD_HTML, "https://example.com/events/smash-weekly");
    expect(drafts).toHaveLength(1);
    const d = drafts[0]!;
    expect(d.title).toBe("Utah Smash Weekly");
    expect(d.startsAt?.toISOString()).toBe("2026-11-08T02:00:00.000Z");
    expect(d.venueName).toBe("LAN King");
    expect(d.city).toBe("Midvale");
    expect(d.state).toBe("UT");
    expect(d.priceCents).toBe(1000);
    expect(d.contactName).toBe("Utah Smash");
    expect(d.gameNames).toContain("Super Smash Bros. Ultimate");
    expect(d.eventType).toBe("casual");
    expect(d.source.adapter).toBe("generic-event");
    expect(d.confidence).toBeGreaterThan(0.8);
  });
});

describe("parseMetaFallback", () => {
  it("extracts from og + event meta tags", () => {
    const drafts = parseMetaFallback(META_HTML, "https://example.com/rl-night");
    expect(drafts).toHaveLength(1);
    const d = drafts[0]!;
    expect(d.title).toBe("Rocket League Night at Quarters");
    expect(d.city).toBe("Ogden");
    expect(d.priceCents).toBe(500);
    expect(d.gameNames).toEqual(["Rocket League"]);
    expect(d.startsAt).not.toBeNull();
  });
});

describe("parseGenericEventHtml", () => {
  it("prefers JSON-LD over meta", () => {
    const drafts = parseGenericEventHtml(JSONLD_HTML + META_HTML, "https://example.com/x");
    expect(drafts[0]!.title).toBe("Utah Smash Weekly");
  });
});

describe("startgg url adapter", () => {
  it("matches and extracts slugs", () => {
    expect(matchStartggUrl("https://start.gg/tournament/utah-smash-monthly")).toBe(true);
    expect(extractStartggSlug("https://start.gg/tournament/utah-smash-monthly")).toBe(
      "utah-smash-monthly",
    );
    expect(matchStartggUrl("https://example.com")).toBe(false);
  });
});

describe("legacy jekyll adapter", () => {
  it("matches repo URLs and rewrites to raw", () => {
    const url =
      "https://github.com/michaelmcshinsky/utah-esports-website/blob/master/_events/2019/03-March/2019-03-01-Prove-It.md";
    expect(matchLegacyJekyllUrl(url)).toBe(true);
    expect(toRawUrl(url)).toBe(
      "https://raw.githubusercontent.com/michaelmcshinsky/utah-esports-website/master/_events/2019/03-March/2019-03-01-Prove-It.md",
    );
  });
});

describe("registry", () => {
  it("routes start.gg URLs to the startgg adapter, GitHub to legacy, others to generic", () => {
    expect(getAdapterForUrl("https://start.gg/tournament/x")?.id).toBe("startgg-url");
    expect(
      getAdapterForUrl(
        "https://github.com/michaelmcshinsky/utah-esports-website/blob/master/_events/x.md",
      )?.id,
    ).toBe("legacy-jekyll");
    expect(getAdapterForUrl("https://quartersslc.com/events/friday")?.id).toBe("generic-event");
  });
});

describe("listing scanner", () => {
  const LISTING_HTML = `<html><body>
    <a href="/events/smash-weekly">Smash Weekly</a>
    <a href="/about">About the venue</a>
    <a href="https://start.gg/tournament/some-bracket">Register for the bracket</a>
    <a href="/menu">Menu</a>
    <script type="application/ld+json">{"@type":"Event","url":"https://example.com/events/jsonld-one"}</script>
  </body></html>`;

  it("extracts event-ish anchors and JSON-LD urls, skips plain links", () => {
    const urls = extractCandidateEventUrls(LISTING_HTML, "https://example.com/");
    expect(urls).toContain("https://example.com/events/smash-weekly");
    expect(urls).toContain("https://start.gg/tournament/some-bracket");
    expect(urls).toContain("https://example.com/events/jsonld-one");
    expect(urls.some((u) => u.endsWith("/about"))).toBe(false);
    expect(urls.some((u) => u.endsWith("/menu"))).toBe(false);
  });

  it("scanListingPage fetches through the provided impl", async () => {
    const fakeFetch = async () =>
      new Response(LISTING_HTML, { status: 200, headers: { "content-type": "text/html" } });
    const urls = await scanListingPage("https://example.com/events", {
      fetchImpl: fakeFetch as unknown as typeof fetch,
      limit: 2,
    });
    expect(urls.length).toBeLessThanOrEqual(2);
    expect(urls.length).toBeGreaterThan(0);
  });
});
