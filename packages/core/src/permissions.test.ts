import { describe, expect, it } from "vitest";
import { roleHasPermission, can, type Membership } from "./permissions.js";

describe("roleHasPermission", () => {
  it("viewer can only view", () => {
    expect(roleHasPermission("viewer", "org:view")).toBe(true);
    expect(roleHasPermission("viewer", "org:edit")).toBe(false);
    expect(roleHasPermission("viewer", "events:create")).toBe(false);
    expect(roleHasPermission("viewer", "events:delete")).toBe(false);
    expect(roleHasPermission("viewer", "org:manage_members")).toBe(false);
  });

  it("editor can edit but not manage members or delete", () => {
    expect(roleHasPermission("editor", "org:view")).toBe(true);
    expect(roleHasPermission("editor", "org:edit")).toBe(true);
    expect(roleHasPermission("editor", "events:create")).toBe(true);
    expect(roleHasPermission("editor", "events:edit")).toBe(true);
    expect(roleHasPermission("editor", "series:manage")).toBe(true);
    expect(roleHasPermission("editor", "announcements:configure")).toBe(true);
    expect(roleHasPermission("editor", "org:manage_members")).toBe(false);
    expect(roleHasPermission("editor", "events:delete")).toBe(false);
  });

  it("owner has every permission", () => {
    const all = [
      "org:view",
      "org:edit",
      "org:manage_members",
      "events:create",
      "events:edit",
      "events:delete",
      "series:manage",
      "announcements:configure",
    ] as const;
    for (const p of all) {
      expect(roleHasPermission("owner", p)).toBe(true);
    }
  });
});

describe("can", () => {
  const memberships: Membership[] = [
    { orgId: "org-1", role: "editor" },
    { orgId: "org-2", role: "viewer" },
  ];

  it("returns true when membership grants the permission", () => {
    expect(can(memberships, "org-1", "events:create")).toBe(true);
    expect(can(memberships, "org-2", "org:view")).toBe(true);
  });

  it("returns false when membership lacks the permission", () => {
    expect(can(memberships, "org-2", "events:create")).toBe(false);
  });

  it("returns false when no membership exists for the org", () => {
    expect(can(memberships, "org-999", "org:view")).toBe(false);
  });

  it("returns false for empty memberships", () => {
    expect(can([], "org-1", "org:view")).toBe(false);
  });
});
