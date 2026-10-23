import { describe, expect, it } from "vitest";
import {
  extractPriceCents,
  inferEventMetadata,
  inferEventType,
  inferGamesFromTitle,
} from "./infer.js";

describe("inferGamesFromTitle", () => {
  it("maps Smash variants", () => {
    expect(inferGamesFromTitle("Nokto Smash Weekly")).toEqual(["Super Smash Bros. Ultimate"]);
    expect(inferGamesFromTitle("GameTyrant Melee Monthly")).toEqual(["Super Smash Bros. Melee"]);
  });
  it("maps multiple games in one title", () => {
    expect(inferGamesFromTitle("Halo 5 & Rocket League LAN")).toEqual([
      "Rocket League",
      "Halo Infinite",
    ]);
  });
  it("maps common Utah scene games", () => {
    expect(inferGamesFromTitle("Fortnite Friday")).toEqual(["Fortnite"]);
    expect(inferGamesFromTitle("League of Legends Battle")).toEqual(["League of Legends"]);
    expect(inferGamesFromTitle("GameTyrant FGC Monthly")).toEqual(["Street Fighter 6"]);
    expect(inferGamesFromTitle("Dota 2 Tournament")).toEqual(["Dota 2"]);
  });
  it("returns empty for unknown titles", () => {
    expect(inferGamesFromTitle("Opening Social")).toEqual([]);
  });
});

describe("inferEventType", () => {
  it("classifies watch parties and tryouts", () => {
    expect(inferEventType("Worlds Viewing Party")).toBe("watch_party");
    expect(inferEventType("Rocket League Tournament and Tryouts")).toBe("tryout");
  });
  it("classifies tournaments", () => {
    expect(inferEventType("Halo 5 Online 2v2 Tournament")).toBe("tournament");
    expect(inferEventType("Salt Lake Skirmish")).toBe("tournament");
  });
  it("classifies casual weeklies and nights", () => {
    expect(inferEventType("Nokto Smash Weekly")).toBe("casual");
    expect(inferEventType("12-Hour Game Night")).toBe("casual");
  });
  it("defaults to other", () => {
    expect(inferEventType("Campus Rec Kickoff")).toBe("other");
  });
});

describe("extractPriceCents", () => {
  it("reads entry prices and ignores pot bonuses", () => {
    expect(extractPriceCents("Smash Royale — $10 entry, $200 pot bonus")).toBe(1000);
    expect(extractPriceCents("$200 Pot Bonus Tournament")).toBeNull();
  });
  it("detects free", () => {
    expect(extractPriceCents("Free entry this week!")).toBe(0);
  });
  it("reads '10 dollar door' style ordering", () => {
    expect(extractPriceCents("$10 door")).toBe(1000);
  });
});

describe("inferEventMetadata", () => {
  it("combines all signals", () => {
    const m = inferEventMetadata("Smash Royale III", "$5 entry at the door");
    expect(m.gameNames).toEqual(["Super Smash Bros. Ultimate"]);
    expect(m.eventType).toBe("tournament");
    expect(m.priceCents).toBe(500);
  });
});

describe("legacy markdown parsing", () => {
  it("parses frontmatter into a draft with inferred metadata", async () => {
    const { parseLegacyEventMarkdown } = await import("./adapters/legacy-jekyll.js");
    const fixture = `---
layout: event
title:  "Fortnite 2v2 – $800 Prize Money"
permalink: /events/2018-08-07-Fortnite-2v2
event_url: "https://facebook.com/events/123"
excerpt: Teams of two compete.
start_date: 2018-08-07
start_time: 
end_date: 2018-08-08
venue_title: "Game Grid"
venue_city: 
venue_url: "https://example.com"
---

Bracket style 2v2 with prize money.
`;
    const draft = parseLegacyEventMarkdown("2018-08-07-Fortnite-2v2.md", fixture);
    expect(draft).not.toBeNull();
    expect(draft!.title).toContain("Fortnite 2v2");
    expect(draft!.gameNames).toEqual(["Fortnite"]);
    expect(draft!.eventType).toBe("tournament");
    expect(draft!.venueName).toBe("Game Grid");
    expect(draft!.startsAt?.getFullYear()).toBe(2018);
    // end_date is date-only → parsed as 23:00 MT on Aug 8 (Aug 9 06:00 UTC).
    expect(draft!.endsAt?.toISOString()).toContain("2018-08-09T06:00");
    expect(draft!.url).toBe("https://facebook.com/events/123");
    expect(draft!.source.adapter).toBe("legacy-jekyll");
  });

  it("returns null without a title", async () => {
    const { parseLegacyEventMarkdown } = await import("./adapters/legacy-jekyll.js");
    expect(parseLegacyEventMarkdown("x.md", "---\nlayout: event\n---\nbody")).toBeNull();
  });
});
