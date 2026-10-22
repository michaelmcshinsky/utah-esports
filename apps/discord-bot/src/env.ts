import { existsSync } from "node:fs";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";

/** Repo-root .env — authoritative over inherited shell vars (override). */
const ROOT_ENV = join(import.meta.dirname, "..", "..", "..", ".env");
if (existsSync(ROOT_ENV)) {
  loadEnv({ path: ROOT_ENV, override: true });
}

export {};
