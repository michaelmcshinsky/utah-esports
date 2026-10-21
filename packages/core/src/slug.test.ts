import { describe, expect, it } from "vitest";
import { eventSlug, legacyEventPath, slugify } from "./slug.js";
import { can, roleHasPermission } from "./permissions.js";

describe("slugify", () => {
  it("normalizes titles", () => {
    expect(slugify("Smash Royale III — $200 Pot Bonus!")).toBe(
      "smash-royale-iii-200-pot-bonus",
    );
    expect(slugify("  Quarters' Bar Fights  ")).toBe("quarters-bar-fights");
  });
});

describe("eventSlug", () => {
  it("prefixes the ISO date", () => {
    expect(eventSlug("Prove It", new Date("2019-03-01T00:00:00Z"))).toBe(
      "2019-03-01-prove-it",
    );
  });
});

describe("legacyEventPath", () => {
  it("keeps Jekyll permalink shape", () => {
    expect(legacyEventPath("2019-03-01-Prove-It.md")).toBe("/events/2019-03-01-Prove-It");
  });
});

describe("permissions", () => {
  it("grants owners everything, viewers only view", () => {
    expect(roleHasPermission("owner", "events:delete")).toBe(true);
    expect(roleHasPermission("viewer", "org:view")).toBe(true);
    expect(roleHasPermission("viewer", "events:edit")).toBe(false);
  });

  it("checks membership across orgs", () => {
    const memberships = [
      { orgId: "org-1", role: "editor" as const },
      { orgId: "org-2", role: "viewer" as const },
    ];
    expect(can(memberships, "org-1", "events:create")).toBe(true);
    expect(can(memberships, "org-2", "events:create")).toBe(false);
    expect(can(memberships, "org-3", "org:view")).toBe(false);
  });
});
