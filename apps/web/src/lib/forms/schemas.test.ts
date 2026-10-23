import { describe, expect, it } from "vitest";
import {
  claimFormSchema,
  dateRangeFormSchema,
  eventFormSchema,
  reportFormSchema,
  savedSearchFormSchema,
  searchHeroFormSchema,
  signInFormSchema,
  submitEventFormSchema,
  teamFormSchema,
} from "./schemas.js";

const validSubmit = {
  title: "Smash Weekly",
  url: "https://start.gg/tournament/x",
  eventType: "casual" as const,
  format: "in_person" as const,
  startsAt: "2026-11-01T18:00",
  endsAt: "",
  gameNames: "Smash Ultimate, Rocket League",
  city: "Provo",
  agePolicy: "all_ages" as const,
  skillLevel: "beginner_friendly" as const,
  beginnerFriendly: true,
  youthProgram: false,
  priceDollars: "10",
  registrationState: "open" as const,
  description: "Weekly chill bracket",
  contactName: "Sam Organiser",
  contactEmail: "sam@example.com",
  notes: "",
};

describe("submitEventFormSchema", () => {
  it("accepts a fully valid form", () => {
    const r = submitEventFormSchema.safeParse(validSubmit);
    expect(r.success).toBe(true);
  });

  it("accepts blank optional fields", () => {
    const r = submitEventFormSchema.safeParse({
      ...validSubmit,
      city: "",
      description: "",
      notes: "",
      priceDollars: "",
      endsAt: "",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an invalid datetime-local value", () => {
    const r = submitEventFormSchema.safeParse({ ...validSubmit, startsAt: "tomorrow" });
    expect(r.success).toBe(false);
  });

  it("requires at least one game", () => {
    const r = submitEventFormSchema.safeParse({ ...validSubmit, gameNames: "" });
    expect(r.success).toBe(false);
  });

  it("rejects a non-email contact", () => {
    const r = submitEventFormSchema.safeParse({ ...validSubmit, contactEmail: "nope" });
    expect(r.success).toBe(false);
  });

  it("rejects a negative price", () => {
    const r = submitEventFormSchema.safeParse({ ...validSubmit, priceDollars: "-5" });
    expect(r.success).toBe(false);
  });
});

describe("eventFormSchema", () => {
  it("extends the submit schema with status + series fields", () => {
    const r = eventFormSchema.safeParse({
      ...validSubmit,
      status: "published",
      repeatWeekly: true,
      recurrenceHint: "Every Thursday",
      seriesEndsOn: "2026-12-31",
      registrationDeadline: "2026-10-30T23:00",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an invalid series end date", () => {
    const r = eventFormSchema.safeParse({
      ...validSubmit,
      status: "draft",
      repeatWeekly: false,
      seriesEndsOn: "next week",
      registrationDeadline: "",
    });
    expect(r.success).toBe(false);
  });
});

describe("reportFormSchema", () => {
  it("accepts blank optional email and details (RHF sends empty strings)", () => {
    const r = reportFormSchema.safeParse({
      reason: "incorrect_info",
      details: "",
      contactEmail: "",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a malformed email when provided", () => {
    const r = reportFormSchema.safeParse({
      reason: "other",
      contactEmail: "not-an-email",
    });
    expect(r.success).toBe(false);
  });
});

describe("signInFormSchema", () => {
  it("requires a valid email", () => {
    expect(signInFormSchema.safeParse({ email: "a@b.co" }).success).toBe(true);
    expect(signInFormSchema.safeParse({ email: "b" }).success).toBe(false);
  });
});

describe("searchHeroFormSchema", () => {
  it("accepts blank fields", () => {
    expect(searchHeroFormSchema.safeParse({ q: "", city: "" }).success).toBe(true);
  });
});

describe("dateRangeFormSchema", () => {
  it("accepts empty or yyyy-MM-dd values only", () => {
    expect(dateRangeFormSchema.safeParse({ q: "", city: "", from: "", to: "" }).success).toBe(true);
    expect(
      dateRangeFormSchema.safeParse({ q: "", city: "", from: "2026-11-01", to: "" }).success,
    ).toBe(true);
    expect(
      dateRangeFormSchema.safeParse({ q: "", city: "", from: "tomorrow", to: "" }).success,
    ).toBe(false);
  });
});

describe("claimFormSchema", () => {
  it("requires proof URL and contact email", () => {
    expect(
      claimFormSchema.safeParse({
        proofUrl: "https://uvu.edu/esports",
        contactEmail: "a@uvu.edu",
        message: "",
      }).success,
    ).toBe(true);
    expect(claimFormSchema.safeParse({ proofUrl: "nope", contactEmail: "", message: "" }).success).toBe(
      false,
    );
  });
});

describe("savedSearchFormSchema", () => {
  it("requires a non-empty name", () => {
    expect(savedSearchFormSchema.safeParse({ name: "Weekend Smash" }).success).toBe(true);
    expect(savedSearchFormSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("teamFormSchema", () => {
  it("accepts a minimal valid team", () => {
    const r = teamFormSchema.safeParse({
      name: "Provo Rockets",
      pathway: "high_school",
      institution: "Provo High",
      city: "Provo",
      tryoutInfo: "Tryouts every Monday",
      websiteUrl: "",
      description: "",
      discordRoleId: "",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a bad discord role id", () => {
    const r = teamFormSchema.safeParse({
      name: "X",
      pathway: "youth",
      websiteUrl: "",
      discordRoleId: "not-numeric",
    });
    expect(r.success).toBe(false);
  });
});
