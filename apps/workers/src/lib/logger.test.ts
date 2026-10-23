import { describe, expect, it, vi, afterEach } from "vitest";
import { log } from "./logger.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("log", () => {
  it("outputs JSON with timestamp, level, job, message", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    log("info", "test-job", "hello");
    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(parsed.level).toBe("info");
    expect(parsed.job).toBe("test-job");
    expect(parsed.message).toBe("hello");
    expect(typeof parsed.ts).toBe("string");
    expect(new Date(parsed.ts).toISOString()).toBe(parsed.ts);
  });

  it("uses console.error for error level", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    log("error", "j", "boom", { detail: "x" });
    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(parsed.level).toBe("error");
    expect(parsed.detail).toBe("x");
  });

  it("uses console.warn for warn level", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    log("warn", "j", "careful");
    expect(spy).toHaveBeenCalledOnce();
  });
});
