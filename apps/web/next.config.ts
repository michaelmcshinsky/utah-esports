import type { NextConfig } from "next";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";

// Repo-root .env drives local dev (Next only auto-loads from this app dir).
// CI/hosts set real env vars directly — a missing file is not an error.
const ROOT_ENV = join(import.meta.dirname, "..", "..", ".env");
if (existsSync(ROOT_ENV)) {
  // Repo .env is authoritative over inherited shell variables in dev.
  loadEnv({ path: ROOT_ENV, override: true });
}

type RedirectEntry = { source: string; destination: string; permanent: boolean };

/** Hardcoded legacy Jekyll paths (mirror of src/lib/legacy-redirects.ts). */
const LEGACY: RedirectEntry[] = [
  { source: "/", destination: "/utah", permanent: true },
  { source: "/streams", destination: "/communities", permanent: true },
  { source: "/streamers", destination: "/communities", permanent: true },
  { source: "/social-groups", destination: "/communities", permanent: true },
  { source: "/teams-and-clubs", destination: "/schools", permanent: true },
  { source: "/teams", destination: "/schools", permanent: true },
  { source: "/vendors-and-venues", destination: "/places", permanent: true },
  { source: "/vendors", destination: "/places", permanent: true },
  { source: "/calendar", destination: "/events", permanent: true },
  { source: "/explore", destination: "/events", permanent: true },
  { source: "/sources", destination: "/", permanent: true },
  { source: "/contact", destination: "/organizers", permanent: true },
];

function loadGeneratedRedirects(): RedirectEntry[] {
  const file = join(import.meta.dirname, "redirects.generated.json");
  if (!existsSync(file)) return [];
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as RedirectEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  // Monorepo: pin tracing root so .next output stays inside this app.
  outputFileTracingRoot: process.cwd(),
  transpilePackages: [
    "@utah-esports/core",
    "@utah-esports/db",
    "@utah-esports/ui",
    "@utah-esports/startgg",
  ],
  eslint: {
    // Lint runs via `pnpm lint`; next build should not double-lint.
    ignoreDuringBuilds: true,
  },
  async redirects() {
    const generated = loadGeneratedRedirects();
    const seen = new Set(LEGACY.map((r) => r.source));
    return [...LEGACY, ...generated.filter((r) => !seen.has(r.source))];
  },
  async headers() {
    // Baseline hardening. No global X-Frame-Options: the embeddable
    // calendar (/embed/calendar/*) intentionally allows cross-origin framing.
    // CSP is intentionally not set globally due to inline styles/scripts in some
    // components; individual pages should set their own CSP where needed.
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com https://cdn.jsdelivr.net",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.supabase.co https://*.supabase.co wss://*.supabase.co https://api.start.gg",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        source: "/embed/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
  webpack(config) {
    // Workspace packages use `.js` specifiers for `.ts` sources (NodeNext style).
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".jsx": [".tsx", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
