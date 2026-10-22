import { spawn } from "node:child_process";
import { createRequire } from "node:module";

/**
 * Port-aware production start: honors platform PORT (Railway/Fly/etc.) and
 * falls back to the local dev port so `next start` never collides with
 * whatever happens to own 3000 on a dev machine. Runs with the package cwd
 * set by the package manager script.
 */
const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const port = process.env.PORT || "3131";

const child = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 0));
