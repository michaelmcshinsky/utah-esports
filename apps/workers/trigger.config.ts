import { defineConfig } from "@trigger.dev/sdk";

/**
 * Trigger.dev v4 configuration.
 *
 * Required for `pnpm trigger-dev` (local dev) and hosted deployments.
 * The project ref is obtained from https://trigger.dev -> your project
 * -> Settings. The secret key (TRIGGER_SECRET_KEY) is set separately
 * as an environment variable.
 */
export default defineConfig({
  // Project ref from the trigger.dev dashboard (public identifier).
  // Replace with your actual project ref after creating a Trigger.dev project.
  project: process.env.TRIGGER_PROJECT_ID ?? "proj_placeholder",
  dirs: ["./src"],
  runtime: "node",
  logLevel: "log",
});
