import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

export type Database = NodePgDatabase<typeof schema>;

// pg's Pool is lazily created; workers/web each own their instance.
const globalForDb = globalThis as unknown as {
  __uePool?: pg.Pool;
  __ueDb?: Database;
};

export function createPool(databaseUrl = process.env.DATABASE_URL): pg.Pool {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and start docker-compose.",
    );
  }
  return new pg.Pool({ connectionString: databaseUrl, max: 10 });
}

export function getDb(databaseUrl?: string): Database {
  if (!globalForDb.__ueDb) {
    globalForDb.__uePool = createPool(databaseUrl);
    globalForDb.__ueDb = drizzle(globalForDb.__uePool, { schema });
  }
  return globalForDb.__ueDb;
}

export { schema };
