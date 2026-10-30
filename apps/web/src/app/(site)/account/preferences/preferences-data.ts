import { userPreferences, games } from "@utah-esports/db";
import type { Database } from "@utah-esports/db";

export { userPreferences };

export async function listGamesSafe(database: Database) {
  try {
    return await database.select().from(games).limit(30);
  } catch {
    return [];
  }
}
