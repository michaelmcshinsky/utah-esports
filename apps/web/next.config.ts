import type { NextConfig } from "next";

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
