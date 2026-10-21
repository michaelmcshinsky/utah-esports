/** URL-safe slug helpers shared by DB writes and redirects. */

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function eventSlug(title: string, date: Date): string {
  const ymd = date.toISOString().slice(0, 10);
  const base = slugify(title);
  return base ? `${ymd}-${base}` : ymd;
}

/** Legacy Jekyll permalinks: /events/2019-03-01-Prove-It */
export function legacyEventPath(filename: string): string {
  const stem = filename.replace(/\.md$/i, "");
  return `/events/${stem}`;
}

export function isLikelySlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
