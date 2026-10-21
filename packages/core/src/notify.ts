/**
 * Quiet hours: no notification sends inside a user's configured window.
 * Handles windows that wrap midnight (e.g. 22 → 8).
 */
export function isInQuietHours(
  hour: number,
  quietStart: number,
  quietEnd: number,
): boolean {
  if (quietStart === quietEnd) return false;
  if (quietStart > quietEnd) {
    return hour >= quietStart || hour < quietEnd;
  }
  return hour >= quietStart && hour < quietEnd;
}
