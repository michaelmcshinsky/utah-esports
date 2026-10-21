/**
 * Duplicate detection for imported events. Uncertain matches go to a review
 * queue — we never silently merge organizer-owned listings.
 */

export type DedupeCandidate = {
  id: string;
  title: string;
  startsAt: Date;
  city: string | null;
};

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function dedupeScore(
  a: { title: string; startsAt: Date; city?: string | null },
  b: { title: string; startsAt: Date; city?: string | null },
): number {
  const ta = normalizeTitle(a.title);
  const tb = normalizeTitle(b.title);
  if (!ta || !tb) return 0;
  let score = 0;
  if (ta === tb) score += 60;
  else if (ta.includes(tb) || tb.includes(ta)) score += 35;
  else {
    const wa = new Set(ta.split(" "));
    const wb = new Set(tb.split(" "));
    const shared = [...wa].filter((w) => wb.has(w) && w.length > 2).length;
    score += Math.min(30, shared * 10);
  }
  const dayDiff = Math.abs(a.startsAt.getTime() - b.startsAt.getTime()) / 86_400_000;
  if (dayDiff < 0.5) score += 25;
  else if (dayDiff < 2) score += 10;
  if (a.city && b.city && a.city.toLowerCase() === b.city.toLowerCase()) score += 10;
  return Math.min(100, score);
}

export const DUPLICATE_THRESHOLD = 70;

export function findLikelyDuplicate<T extends DedupeCandidate>(
  incoming: { title: string; startsAt: Date; city?: string | null },
  existing: readonly T[],
): { match: T; score: number } | null {
  let best: { match: T; score: number } | null = null;
  for (const candidate of existing) {
    const score = dedupeScore(incoming, candidate);
    if (score >= DUPLICATE_THRESHOLD && (!best || score > best.score)) {
      best = { match: candidate, score };
    }
  }
  return best;
}
