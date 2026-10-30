import { NextResponse } from "next/server";

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 100;

const ipRequestMap = new Map<string, { count: number; windowStart: number }>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  if (forwarded) {
    const parts = forwarded.split(",");
    const firstPart = parts[0];
    if (firstPart) return firstPart.trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = ipRequestMap.get(ip);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    ipRequestMap.set(ip, { count: 1, windowStart: Date.now() });
    return false;
  }

  if (record.count >= MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

export function rateLimit(request: Request): NextResponse | null {
  if (!request.url.includes("/api/")) return null;

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  return null;
}

export function clearRateLimit() {
  ipRequestMap.clear();
}

export function getRateLimitInfo(ip: string) {
  return ipRequestMap.get(ip);
}