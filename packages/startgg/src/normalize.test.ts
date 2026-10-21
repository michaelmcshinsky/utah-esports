import { describe, expect, it } from "vitest";
import { matchGameSlug, normalizeStartggEvent } from "./normalize.js";
import type { StartggEvent } from "./types.js";

const baseEvent: StartggEvent = {
  id: "123",
  name: "Smash Royale IV",
  slug: "smash-royale-iv",
  startAt: 1761302400, // 2025-10-24T04:00:00Z
  endAt: 1761316800,
  timezone: "America/Denver",
  isOnline: false,
  city: "West Valley City",
  region: null,
  postalCode: "84119",
  addrState: "UT",
  countryCode: "US",
  registrationDeadline: 1761216000,
  currency: "USD",
  images: [{ url: "https://img.example/p.jpg", type: "profile" }],
  host: { id: "9", name: "LAN King", slug: "lan-king" },
  venue: {
    id: "v1",
    name: "LAN King",
    address: "123 Main",
    city: "West Valley City",
    state: "UT",
    postalCode: "84119",
    countryCode: "US",
    latitude: 40.6916,
    longitude: -112.0068,
  },
  videogame: {
    id: "1386",
    name: "Super Smash Bros. Ultimate",
    slug: "super-smash-brothers-ultimate",
  },
  type: "tournament",
};

describe("normalizeStartggEvent", () => {
  it("maps core fields and preserves source URL", () => {
    const n = normalizeStartggEvent(baseEvent);
    expect(n.externalId).toBe("123");
    expect(n.title).toBe("Smash Royale IV");
    expect(n.format).toBe("in_person");
    expect(n.city).toBe("West Valley City");
    expect(n.lat).toBe(40.6916);
    expect(n.registrationUrl).toBe("https://start.gg/tournament/smash-royale-iv");
    expect(n.startsAt.toISOString()).toBe("2025-10-24T10:40:00.000Z");
    expect(n.videogameSlug).toBe("super-smash-brothers-ultimate");
  });

  it("marks online events without inventing a venue", () => {
    const n = normalizeStartggEvent({ ...baseEvent, isOnline: true, venue: null });
    expect(n.format).toBe("online");
    expect(n.lat).toBeNull();
    expect(n.onlineUrl).toContain("start.gg");
  });
});

describe("matchGameSlug", () => {
  const known = [
    { slug: "valorant", name: "VALORANT", startggVideogameSlug: "valorant" },
    {
      slug: "super-smash-brothers-ultimate",
      name: "Super Smash Bros. Ultimate",
      startggVideogameSlug: "super-smash-brothers-ultimate",
    },
  ];
  it("matches by startgg slug", () => {
    expect(
      matchGameSlug({ slug: "valorant", name: "VALORANT" }, known),
    ).toBe("valorant");
  });
  it("falls back to normalized name", () => {
    expect(
      matchGameSlug({ slug: "something-else", name: "Super Smash Bros. Ultimate" }, known),
    ).toBe("super-smash-brothers-ultimate");
  });
  it("returns null when unknown", () => {
    expect(matchGameSlug({ slug: "x", name: "Unknown Game" }, known)).toBeNull();
  });
});
