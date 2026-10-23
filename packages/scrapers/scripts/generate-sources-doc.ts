import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { UTAH_SOURCES, KIND_LABELS } from "../src/catalog/utah-sources.js";

/**
 * Generates docs/SOURCES.md from the typed catalog.
 *   pnpm --filter @utah-esports/scrapers exec tsx scripts/generate-sources-doc.ts
 */

const out = join(import.meta.dirname, "..", "..", "..", "docs", "SOURCES.md");

const lines: string[] = [];
lines.push("# Utah Esports — Source Catalog");
lines.push("");
lines.push(
  "> Generated from `packages/scrapers/src/catalog/utah-sources.ts` — edit that file and re-run",
  "> `pnpm --filter @utah-esports/scrapers exec tsx scripts/generate-sources-doc.ts`.",
  "",
);
lines.push(
  `**${UTAH_SOURCES.length} tracked sources** across ${Object.keys(KIND_LABELS).length} categories. See [SCRAPING.md](./SCRAPING.md) for how imports work.`,
  "",
);

const byKind = new Map<string, typeof UTAH_SOURCES>();
for (const s of UTAH_SOURCES) {
  const list = byKind.get(s.kind) ?? [];
  list.push(s);
  byKind.set(s.kind, list);
}

for (const [kind, entries] of byKind) {
  lines.push(`## ${KIND_LABELS[kind as keyof typeof KIND_LABELS] ?? kind}`);
  lines.push("");
  for (const s of entries) {
    lines.push(`### ${s.name}`);
    lines.push("");
    lines.push(`- **URL**: ${s.url}`);
    if (s.city) lines.push(`- **Location**: ${s.city}${s.region ? ` (${s.region})` : ""}`);
    lines.push(`- **Status**: \`${s.status}\``);
    lines.push(`- **Scrape**: \`${s.scrape.adapter}\``);
    if (s.scrape.listingUrls?.length) {
      lines.push(`- **Listing pages**: ${s.scrape.listingUrls.join(", ")}`);
    }
    if (s.scrape.eventUrlPatterns?.length) {
      lines.push(`- **Event URL patterns**: \`${s.scrape.eventUrlPatterns.join("`, `")}\``);
    }
    if (s.scrape.notes) lines.push(`- **How**: ${s.scrape.notes}`);
    if (s.directory) {
      lines.push(
        `- **Directory**: ${s.directory.types.join(", ")}${s.directory.imported ? " — imported ✓" : " — pending"}`,
      );
      if (s.directory.notes) lines.push(`  - ${s.directory.notes}`);
    }
    if (s.games?.length) lines.push(`- **Games**: ${s.games.join(", ")}`);
    if (s.notes) lines.push(`- **Notes**: ${s.notes}`);
    lines.push("");
  }
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, lines.join("\n"));
console.log(`wrote ${out} (${UTAH_SOURCES.length} sources)`);
