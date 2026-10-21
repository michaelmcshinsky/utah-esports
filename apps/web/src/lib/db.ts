import { getDb, type Database } from "@utah-esports/db";

/** Web-tier DB accessor — reuses the package singleton per request lifecycle. */
export function db(): Database {
  return getDb(process.env.DATABASE_URL);
}
