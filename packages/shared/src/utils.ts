/**
 * State-agnostic utility functions shared across all state sites.
 */

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", opts ?? { month: "short", day: "numeric", year: "numeric" });
}

export function formatEventDate(startsAt: Date | string, endsAt?: Date | string | null): string {
  const start = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  const end = endsAt ? (typeof endsAt === "string" ? new Date(endsAt) : endsAt) : null;
  const day = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return end ? `${day} ${time} – ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : `${day} ${time}`;
}

export function formatPrice(cents: number | null | undefined): string | null {
  if (cents == null) return null;
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

export function daysUntil(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function isUpcoming(date: Date | string): boolean {
  return daysUntil(date) >= 0;
}
