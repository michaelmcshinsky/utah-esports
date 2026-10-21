import { describe, expect, it } from "vitest";
import {
  DEFAULT_FILTERS,
  applyPreset,
  distanceKm,
  filterAndSort,
  matchesFilter,
  parseFilters,
  serializeFilters,
  type FilterableEvent,
} from "./filters.js";

function makeEvent(overrides: Partial<FilterableEvent> = {}): FilterableEvent {
  return {
    title: "Weekly Smash Night",
    description: "Casual ultimate brackets",
    startsAt: new Date("2026-10-24T18:00:00Z"),
    format: "in_person",
    eventType: "casual",
    city: "West Valley City",
    region: "salt_lake_valley",
    lat: 40.6916,
    lng: -112.0068,
    agePolicy: "all_ages",
    skillLevel: "beginner_friendly",
    entryMode: "either",
    platforms: ["switch"],
    gameSlugs: ["super-smash-brothers-ultimate"],
    priceCents: 1000,
    registrationState: "open",
    beginnerFriendly: true,
    youthProgram: false,
    lastConfirmedAt: new Date("2026-10-01T00:00:00Z"),
    status: "published",
    ...overrides,
  };
}

describe("parseFilters", () => {
  it("parses csv lists and coerces numbers", () => {
    const f = parseFilters(
      new URLSearchParams(
        "games=valorant,rocket-league&radiusKm=25&freeOnly=true&sort=distance",
      ),
    );
    expect(f.games).toEqual(["valorant", "rocket-league"]);
    expect(f.radiusKm).toBe(25);
    expect(f.freeOnly).toBe(true);
    expect(f.sort).toBe("distance");
  });

  it("falls back to defaults on garbage input", () => {
    const f = parseFilters(new URLSearchParams("radiusKm=banana&page=0"));
    expect(f).toEqual(DEFAULT_FILTERS);
  });
});

describe("serializeFilters round-trip", () => {
  it("round-trips through parse", () => {
    const original = parseFilters(
      new URLSearchParams(
        "games=smash&types=tournament&city=Provo&beginnerOnly=true&pageSize=10",
      ),
    );
    const reparsed = parseFilters(new URLSearchParams(serializeFilters(original)));
    expect(reparsed).toEqual(original);
  });
});

describe("matchesFilter", () => {
  it("matches a basic upcoming event", () => {
    const r = matchesFilter(makeEvent(), DEFAULT_FILTERS);
    expect(r.matches).toBe(true);
  });

  it("rejects drafts and cancelled", () => {
    expect(matchesFilter(makeEvent({ status: "draft" }), DEFAULT_FILTERS).matches).toBe(false);
    expect(matchesFilter(makeEvent({ status: "cancelled" }), DEFAULT_FILTERS).matches).toBe(
      false,
    );
  });

  it("filters by game slug", () => {
    const filter = parseFilters(new URLSearchParams("games=valorant"));
    expect(matchesFilter(makeEvent(), filter).matches).toBe(false);
    const filter2 = parseFilters(new URLSearchParams("games=super-smash-brothers-ultimate"));
    expect(matchesFilter(makeEvent(), filter2).matches).toBe(true);
  });

  it("filters freeOnly against price", () => {
    const filter = parseFilters(new URLSearchParams("freeOnly=true"));
    expect(matchesFilter(makeEvent({ priceCents: 0 }), filter).matches).toBe(true);
    expect(matchesFilter(makeEvent({ priceCents: 500 }), filter).matches).toBe(false);
  });

  it("applies radius via haversine", () => {
    const filter = parseFilters(
      new URLSearchParams("lat=40.7608&lng=-111.891&radiusKm=20"),
    );
    // WVC ~12km from SLC
    expect(matchesFilter(makeEvent(), filter).matches).toBe(true);
    const far = makeEvent({ lat: 37.0965, lng: -113.5684 }); // St. George
    expect(matchesFilter(far, filter).matches).toBe(false);
  });

  it("matches city substring case-insensitively", () => {
    const filter = parseFilters(new URLSearchParams("city=west valley"));
    expect(matchesFilter(makeEvent(), filter).matches).toBe(true);
  });
});

describe("filterAndSort", () => {
  it("sinks stale events below fresh ones", () => {
    const stale = makeEvent({
      title: "Stale",
      lastConfirmedAt: new Date("2025-01-01T00:00:00Z"),
    });
    const fresh = makeEvent({ title: "Fresh", lastConfirmedAt: new Date() });
    const now = new Date("2026-10-21T00:00:00Z");
    const result = filterAndSort([stale, fresh], DEFAULT_FILTERS, now);
    expect(result[0]?.title).toBe("Fresh");
  });

  it("sorts by distance when requested", () => {
    const near = makeEvent({ title: "Near", lat: 40.77, lng: -111.9 });
    const far = makeEvent({ title: "Far", lat: 40.23, lng: -111.65 });
    const filter = parseFilters(
      new URLSearchParams("lat=40.7608&lng=-111.891&sort=distance"),
    );
    const result = filterAndSort([far, near], filter);
    expect(result[0]?.title).toBe("Near");
  });
});

describe("distanceKm", () => {
  it("computes SLC→Provo ≈ 68km", () => {
    const km = distanceKm(40.7608, -111.891, 40.2338, -111.6585);
    expect(km).toBeGreaterThan(60);
    expect(km).toBeLessThan(75);
  });
});

describe("applyPreset", () => {
  it("tonight bounds to today", () => {
    const now = new Date("2026-10-21T15:00:00Z");
    const f = applyPreset("tonight", DEFAULT_FILTERS, now);
    expect(new Date(f.from!).getTime()).toBeLessThanOrEqual(now.getTime());
    expect(new Date(f.to!).getTime()).toBeGreaterThanOrEqual(now.getTime());
  });

  it("weekend finds an upcoming Friday", () => {
    const now = new Date("2026-10-21T15:00:00Z"); // Wednesday
    const f = applyPreset("weekend", DEFAULT_FILTERS, now);
    const from = new Date(f.from!);
    expect(from.getDay()).toBe(5);
  });
});
