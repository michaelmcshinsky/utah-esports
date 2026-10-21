import { describe, expect, it } from "vitest";
import { renderWeeklyDigest, ConsoleTransport } from "./index.js";

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
