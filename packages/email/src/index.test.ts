import { describe, expect, it } from "vitest";
import {
  renderWeeklyDigest,
  renderDeadlineReminder,
  renderChangeNotice,
  renderFreshnessRequest,
  renderSavedSearchAlert,
  renderPostEventFollowup,
  ConsoleTransport,
} from "./index.js";

describe("renderWeeklyDigest", () => {
  it("includes events and escapes html", () => {
    const msg = renderWeeklyDigest({
      name: "Alex <admin>",
      siteUrl: "https://utahesports.net",
      events: [
        {
          title: "Smash <Weekly>",
          url: "https://utahesports.net/events/x",
          whenLabel: "Fri 7pm",
          city: "Provo",
          gameNames: ["Smash"],
        },
      ],
    });
    expect(msg.subject).toContain("1 event");
    expect(msg.html).toContain("Smash &lt;Weekly&gt;");
    expect(msg.text).toContain("Fri 7pm");
  });

  it("handles empty weeks", () => {
    const msg = renderWeeklyDigest({ name: null, siteUrl: "https://utahesports.net", events: [] });
    expect(msg.text).toContain("0 upcoming Utah gaming events");
  });
});

describe("ConsoleTransport", () => {
  it("returns an id without throwing", async () => {
    const t = new ConsoleTransport();
    const result = await t.send({ to: "a@b.c", subject: "s", html: "<p>hi</p>", text: "hi" });
    expect(result.id).toMatch(/^console-/);
  });
});

describe("renderDeadlineReminder", () => {
  it("includes event title and deadline", () => {
    const msg = renderDeadlineReminder({
      eventTitle: "Smash Weekly",
      eventUrl: "https://utahesports.net/events/smash",
      deadlineLabel: "tomorrow",
    });
    expect(msg.subject).toContain("Smash Weekly");
    expect(msg.text).toContain("tomorrow");
    expect(msg.html).toContain("Smash Weekly");
  });

  it("escapes html in title", () => {
    const msg = renderDeadlineReminder({
      eventTitle: "A <B> C",
      eventUrl: "https://example.com",
      deadlineLabel: "Friday",
    });
    expect(msg.html).toContain("A &lt;B&gt; C");
  });
});

describe("renderChangeNotice", () => {
  it("includes change summary and event url", () => {
    const msg = renderChangeNotice({
      eventTitle: "LAN Party",
      eventUrl: "https://utahesports.net/events/lan",
      changeSummary: "moved to Saturday",
    });
    expect(msg.subject).toContain("LAN Party");
    expect(msg.text).toContain("moved to Saturday");
    expect(msg.html).toContain("moved to Saturday");
  });
});

describe("renderFreshnessRequest", () => {
  it("includes confirm and listing urls", () => {
    const msg = renderFreshnessRequest({
      orgName: "Utah Smash",
      eventTitle: "Weekly #42",
      eventUrl: "https://utahesports.net/events/w42",
      confirmUrl: "https://utahesports.net/api/events/abc/confirm",
    });
    expect(msg.subject).toContain("Weekly #42");
    expect(msg.text).toContain("https://utahesports.net/api/events/abc/confirm");
    expect(msg.text).toContain("https://utahesports.net/events/w42");
    expect(msg.html).toContain("https://utahesports.net/api/events/abc/confirm");
  });

  it("escapes org name", () => {
    const msg = renderFreshnessRequest({
      orgName: "A&B",
      eventTitle: "E",
      eventUrl: "https://example.com",
      confirmUrl: "https://example.com/confirm",
    });
    expect(msg.html).toContain("A&amp;B");
  });
});

describe("renderSavedSearchAlert", () => {
  it("includes search name and matching events", () => {
    const msg = renderSavedSearchAlert({
      name: "Sam",
      searchName: "Provo Smash",
      siteUrl: "https://utahesports.net",
      events: [
        {
          title: "Event A",
          url: "https://utahesports.net/events/a",
          whenLabel: "Sat 2pm",
          city: "Provo",
          gameNames: [],
        },
      ],
    });
    expect(msg.subject).toContain("Provo Smash");
    expect(msg.html).toContain("Event A");
    expect(msg.text).toContain("Sam");
  });
});

describe("renderPostEventFollowup", () => {
  it("includes event title and organizer", () => {
    const msg = renderPostEventFollowup({
      organizerName: "Utah FGC",
      eventTitle: "Monthly #10",
      eventUrl: "https://utahesports.net/events/m10",
    });
    expect(msg.subject).toContain("Monthly #10");
    expect(msg.html).toContain("Utah FGC");
    expect(msg.html).toContain("Monthly #10");
    expect(msg.text).toContain("Monthly #10");
  });
});
