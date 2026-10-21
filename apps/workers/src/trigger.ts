import { schedules } from "@trigger.dev/sdk";
import { runStartggSync } from "./jobs/startgg-sync.js";
import { runFreshnessCheck } from "./jobs/freshness.js";
import { runLinkChecks } from "./jobs/link-check.js";
import { runDeadlineReminders } from "./jobs/deadline-reminders.js";
import { runWeeklyDigest } from "./jobs/weekly-digest.js";
import { runRecurringGeneration } from "./jobs/recurring.js";
import { runChangeNotifications } from "./jobs/notify-changes.js";
import { runSavedSearchAlerts } from "./jobs/saved-search-alerts.js";
import { runPostEventFollowup } from "./jobs/post-event.js";

/**
 * Trigger.dev task definitions (hosted scheduling + retries).
 * All logic lives in plain modules so the local runner can reuse it.
 */

export const startggSyncTask = schedules.task({
  id: "startgg-sync",
  cron: "0 */6 * * *",
  maxDuration: 300,
  run: async () => runStartggSync(),
});

export const freshnessTask = schedules.task({
  id: "freshness-check",
  cron: "0 9 * * *",
  maxDuration: 300,
  run: async () => runFreshnessCheck(),
});

export const linkCheckTask = schedules.task({
  id: "link-check",
  cron: "0 10 * * *",
  maxDuration: 600,
  run: async () => runLinkChecks(),
});

export const deadlineReminderTask = schedules.task({
  id: "deadline-reminders",
  cron: "0 * * * *",
  maxDuration: 300,
  run: async () => runDeadlineReminders(),
});

export const weeklyDigestTask = schedules.task({
  id: "weekly-digest",
  cron: "0 16 * * 1",
  maxDuration: 600,
  run: async () => runWeeklyDigest(),
});

export const recurringGenerationTask = schedules.task({
  id: "recurring-generation",
  cron: "30 * * * *",
  maxDuration: 300,
  run: async () => runRecurringGeneration(),
});

export const changeNotificationsTask = schedules.task({
  id: "change-notifications",
  cron: "15 * * * *",
  maxDuration: 300,
  run: async () => runChangeNotifications(),
});

export const savedSearchAlertsTask = schedules.task({
  id: "saved-search-alerts",
  cron: "45 * * * *",
  maxDuration: 300,
  run: async () => runSavedSearchAlerts(),
});

export const postEventTask = schedules.task({
  id: "post-event-followup",
  cron: "20 */2 * * *",
  maxDuration: 300,
  run: async () => runPostEventFollowup(),
});
