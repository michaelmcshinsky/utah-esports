type Level = "info" | "warn" | "error";

export function log(
  level: Level,
  job: string,
  message: string,
  extra?: Record<string, unknown>,
) {
  const line = { ts: new Date().toISOString(), level, job, message, ...extra };
  if (level === "error") console.error(JSON.stringify(line));
  else if (level === "warn") console.warn(JSON.stringify(line));
  else console.log(JSON.stringify(line));
}
