import { describe, expect, it } from "vitest";
import { buildIcsCalendar, type IcsEvent } from "./ics.js";

describe("buildIcsCalendar", () => {
  const event: IcsEvent = {
    uid: "abc-123@utahesports.net",
    title: "Smash Weekly; Finals Night",
    description: "Line 1\nLine 2",
    url: "https://utahesports.net/events/test",
    location: "Game Grid, West Valley City, UT",
    startsAt: new Date("2026-10-24T01:00:00Z"),
    endsAt: new Date("2026-10-24T05:00:00Z"),
  };

  it("emits a valid VCALENDAR with one VEVENT", () => {
    const ics = buildIcsCalendar({ calendarName: "Utah Esports", events: [event] });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:abc-123@utahesports.net");
    expect(ics).toContain("DTSTART:20261024T010000Z");
    expect(ics).toContain("DTEND:20261024T050000Z");
    expect(ics.endsWith("\r\n")).toBe(true);
  });

  it("escapes reserved iCal characters", () => {
    const ics = buildIcsCalendar({ calendarName: "A,B", events: [event] });
    expect(ics).toContain("X-WR-CALNAME:A\\,B");
    expect(ics).toContain("SUMMARY:Smash Weekly\\; Finals Night");
    expect(ics).toContain("DESCRIPTION:Line 1\\nLine 2");
  });

  it("marks cancelled status", () => {
    const ics = buildIcsCalendar({
      calendarName: "Test",
      events: [{ ...event, status: "CANCELLED" }],
    });
    expect(ics).toContain("STATUS:CANCELLED");
  });
});
