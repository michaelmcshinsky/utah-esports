import "dotenv/config";
import { runStartggSync } from "./jobs/startgg-sync.js";
import { runFreshnessCheck } from "./jobs/freshness.js";
import { runLinkChecks } from "./jobs/link-check.js";
import { runRecurringGeneration } from "./jobs/recurring.js";
import { runDeadlineReminders } from "./jobs/deadline-reminders.js";
import { runWeeklyDigest } from "./jobs/weekly-digest.js";
import { runChangeNotifications } from "./jobs/notify-changes.js";
import { runSavedSearchAlerts } from "./jobs/saved-search-alerts.js";
import { runPostEventFollowup } from "./jobs/post-event.js";
import { log } from "./lib/logger.js";

/**
 * Local development scheduler — no Trigger.dev account required.
 * Run jobs on simple intervals; production uses trigger.ts tasks.
 *
 *   pnpm dev            # all jobs on their natural cadence
 *   pnpm start --once   # run every job once and exit
 */

const JOBS: Array<{ name: string; everyMs: number; run: () => Promise<unknown> }> = [
  { name: "startgg-sync", everyMs: 6 * 60 * 60 * 1000, run: () => runStartggSync() },
  { name: "freshness", everyMs: 24 * 60 * 60 * 1000, run: () => runFreshnessCheck() },
  { name: "link-check", everyMs: 24 * 60 * 60 * 1000, run: () => runLinkChecks() },
  { name: "recurring", everyMs: 60 * 60 * 1000, run: () => runRecurringGeneration() },
  { name: "deadline-reminders", everyMs: 60 * 60 * 1000, run: () => runDeadlineReminders() },
  { name: "weekly-digest", everyMs: 24 * 60 * 60 * 1000, run: () => runWeeklyDigest() },
  { name: "change-notifications", everyMs: 60 * 60 * 1000, run: () => runChangeNotifications() },
  { name: "saved-search-alerts", everyMs: 60 * 60 * 1000, run: () => runSavedSearchAlerts() },
  { name: "post-event", everyMs: 2 * 60 * 60 * 1000, run: () => runPostEventFollowup() },
];

async function runOnce() {
  for (const job of JOBS) {
    log("info", "local-runner", `running ${job.name}`);
    try {
      await job.run();
    } catch (err) {
      log("error", "local-runner", `${job.name} failed`, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

async function main() {
  const once = process.argv.includes("--once");
  if (once) {
    await runOnce();
    process.exit(0);
  }
  log("info", "local-runner", "starting interval scheduler");
  for (const job of JOBS) {
    setInterval(() => {
      void job.run().catch((err) => {
        log("error", "local-runner", `${job.name} failed`, {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }, job.everyMs);
  }
  // Keep process alive.
  process.stdin.resume();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
