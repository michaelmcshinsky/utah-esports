import { describe, expect, it } from "vitest";
import { legacyRedirect } from "./legacy-redirects.js";

const origin = "https://utahesports.net";

describe("legacyRedirect", () => {
  it("redirects old community paths", () => {
    const res = legacyRedirect("/streams", origin);
    expect(res?.headers.get("location")).toBe("https://utahesports.net/communities");
    expect(res?.status).toBe(301);
  });

  it("lowercases legacy event permalinks", () => {
    const res = legacyRedirect("/events/2019-03-01-Prove-It", origin);
    expect(res?.headers.get("location")).toBe(
      "https://utahesports.net/events/2019-03-01-prove-it",
    );
  });

  it("leaves modern paths alone", () => {
    expect(legacyRedirect("/explore", origin)).toBeNull();
    expect(legacyRedirect("/events/2026-01-01-new-year-smash", origin)).toBeNull();
  });
});
