import { describe, expect, it } from "vitest";
import { commands } from "./commands.js";

describe("slash commands", () => {
  it("registers exactly four commands", () => {
    expect(commands).toHaveLength(4);
  });

  it("exposes the expected command names", () => {
    const names = commands.map((c) => c.name).sort();
    expect(names).toEqual(["events", "link", "roster", "roster-admin"]);
  });

  it("events command has game, when, and city options", () => {
    const events = commands.find((c) => c.name === "events")!;
    const options = events.options?.map((o) => o.name) ?? [];
    expect(options).toEqual(["game", "when", "city"]);
  });

  it("events command 'when' option offers today/week/month choices", () => {
    const events = commands.find((c) => c.name === "events")!;
    const when = events.options?.find((o) => o.name === "when") as
      | { choices?: Array<{ value: string }> }
      | undefined;
    const values = when?.choices?.map((ch) => ch.value) ?? [];
    expect(values).toEqual(["today", "week", "month"]);
  });

  it("roster command requires a team option", () => {
    const roster = commands.find((c) => c.name === "roster")!;
    const team = roster.options?.find((o) => o.name === "team");
    expect(team).toBeDefined();
    expect(team!.required).toBe(true);
  });

  it("link command requires a code option", () => {
    const link = commands.find((c) => c.name === "link")!;
    const code = link.options?.find((o) => o.name === "code");
    expect(code).toBeDefined();
    expect(code!.required).toBe(true);
  });

  it("roster-admin command has action and team options both required", () => {
    const admin = commands.find((c) => c.name === "roster-admin")!;
    const action = admin.options?.find((o) => o.name === "action");
    const team = admin.options?.find((o) => o.name === "team");
    expect(action?.required).toBe(true);
    expect(team?.required).toBe(true);
  });

  it("roster-admin action option offers add/remove/setrole choices", () => {
    const admin = commands.find((c) => c.name === "roster-admin")!;
    const action = admin.options?.find((o) => o.name === "action") as
      | { choices?: Array<{ value: string }> }
      | undefined;
    const values = action?.choices?.map((ch) => ch.value) ?? [];
    expect(values).toEqual(["add", "remove", "setrole"]);
  });
});
