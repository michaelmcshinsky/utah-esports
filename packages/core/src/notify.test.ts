import { describe, expect, it } from "vitest";
import { isInQuietHours } from "./notify.js";

describe("isInQuietHours", () => {
  it("handles a non-wrapping window", () => {
    expect(isInQuietHours(9, 9, 17)).toBe(true);
    expect(isInQuietHours(16, 9, 17)).toBe(true);
    expect(isInQuietHours(17, 9, 17)).toBe(false);
    expect(isInQuietHours(8, 9, 17)).toBe(false);
  });

  it("handles a window that wraps midnight", () => {
    expect(isInQuietHours(23, 22, 8)).toBe(true);
    expect(isInQuietHours(2, 22, 8)).toBe(true);
    expect(isInQuietHours(7, 22, 8)).toBe(true);
    expect(isInQuietHours(8, 22, 8)).toBe(false);
    expect(isInQuietHours(12, 22, 8)).toBe(false);
    expect(isInQuietHours(21, 22, 8)).toBe(false);
  });

  it("never quiet when start equals end", () => {
    expect(isInQuietHours(3, 3, 3)).toBe(false);
    expect(isInQuietHours(12, 3, 3)).toBe(false);
  });
});
