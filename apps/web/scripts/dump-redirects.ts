import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { config } from "dotenv";
import pg from "pg";

/**
 * Dumps the redirects table into redirects.generated.json so
 * next.config.ts can serve DB-managed 301s from the static redirect
 * pipeline (edge middleware can't query Postgres).
 *
 *   pnpm --filter @utah-esports/web dump-redirects
 *
 * CI builds fall back to an empty list when the file or DB is absent.
 */
config({ path: join(import.meta.dirname, "..", "..", "..", ".env") });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }
  const pool = new pg.Pool({ connectionString: url });
  const { rows } = await pool.query(
    "select from_path, to_path, status_code from redirects order by from_path",
  );
  await pool.end();
  const entries = rows.map((r) => ({
    source: r.from_path,
    destination: r.to_path,
    permanent: r.status_code === 301,
  }));
  const out = join(import.meta.dirname, "..", "redirects.generated.json");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(entries, null, 2) + "\n");
  console.log(`wrote ${entries.length} redirects to redirects.generated.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
