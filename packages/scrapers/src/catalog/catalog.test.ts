import { describe, expect, it } from "vitest";
import { UTAH_SOURCES, KIND_LABELS } from "./utah-sources.js";
import { listAdapters } from "../registry.js";
import "../index.js"; // registers built-in adapters

describe("utah source catalog integrity", () => {
  const slugs = UTAH_SOURCES.map((s) => s.slug);

  it("has no duplicate slugs", () => {
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses only known kinds", () => {
    for (const s of UTAH_SOURCES) {
      expect(KIND_LABELS[s.kind], `${s.slug} kind`).toBeTruthy();
    }
  });

  it("uses only valid statuses", () => {
    const valid = new Set(["active", "unknown", "defunct", "archived"]);
    for (const s of UTAH_SOURCES) {
      expect(valid.has(s.status), `${s.slug} status=${s.status}`).toBe(true);
    }
  });

  it("references only registered adapters (or none)", () => {
    const known = new Set([...listAdapters().map((a) => a.id), "none"]);
    for (const s of UTAH_SOURCES) {
      expect(known.has(s.scrape.adapter), `${s.slug} adapter=${s.scrape.adapter}`).toBe(true);
    }
  });

  it("has well-formed http(s) urls and listing urls", () => {
    const isUrl = (u: string) => {
      try {
        const parsed = new URL(u);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    };
    for (const s of UTAH_SOURCES) {
      expect(isUrl(s.url), `${s.slug} url`).toBe(true);
      for (const listing of s.scrape.listingUrls ?? []) {
        expect(isUrl(listing), `${s.slug} listing=${listing}`).toBe(true);
      }
    }
  });

  it("keeps defunct entries free of listing scans", () => {
    for (const s of UTAH_SOURCES) {
      if (s.status === "defunct") {
        expect(s.scrape.listingUrls ?? [], `${s.slug} should not scan`).toHaveLength(0);
      }
    }
  });

  it("covers every directory data type at least once", () => {
    const types = new Set(UTAH_SOURCES.flatMap((s) => s.directory?.types ?? []));
    for (const t of ["vendor", "team", "social_group"]) {
      expect(types.has(t as never), `directory type ${t}`).toBe(true);
    }
  });
});
