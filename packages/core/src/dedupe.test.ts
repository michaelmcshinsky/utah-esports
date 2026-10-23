import { describe, expect, it } from "vitest";
import { dedupeScore, findLikelyDuplicate, normalizeTitle } from "./dedupe.js";

describe("dedupe", () => {
  it("normalizes titles", () => {
    expect(normalizeTitle("Smash Royale III!")).toBe("smash royale iii");
  });

  it("scores same title + day highly", () => {
    const score = dedupeScore(
      { title: "Smash Weekly", startsAt: new Date("2026-10-24T01:00:00Z"), city: "Provo" },
      { title: "Smash Weekly", startsAt: new Date("2026-10-24T02:00:00Z"), city: "provo" },
    );
    expect(score).toBeGreaterThanOrEqual(90);
  });

  it("finds likely duplicates only above threshold", () => {
    const existing = [
      { id: "1", title: "Fortnite Friday", startsAt: new Date("2026-10-24T01:00:00Z"), city: "SLC" },
      { id: "2", title: "Tekken Night", startsAt: new Date("2026-10-25T01:00:00Z"), city: "SLC" },
    ];
    const dup = findLikelyDuplicate(
      { title: "Fortnite Friday", startsAt: new Date("2026-10-24T01:30:00Z"), city: "SLC" },
      existing,
    );
    expect(dup?.match.id).toBe("1");
    const none = findLikelyDuplicate(
      { title: "Rocket League Cup", startsAt: new Date("2026-11-01T01:00:00Z"), city: "SLC" },
      existing,
    );
    expect(none).toBeNull();
  });
});
