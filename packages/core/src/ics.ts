/**
 * Minimal iCalendar (RFC 5545) generation — no dependencies.
 * Used for global, org, and filtered calendar subscriptions plus
 * per-event "add to calendar" downloads.
 */

export type IcsEvent = {
  uid: string;
  title: string;
  description?: string | null;
  url?: string | null;
  location?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  status?: "CONFIRMED" | "TENTATIVE" | "CANCELLED";
};

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function formatUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Fold lines at 75 octets per RFC 5545 §3.1 (ASCII-safe approximation). */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  if (rest.length) parts.push(` ${rest}`);
  return parts.join("\r\n");
}

export type BuildCalendarOptions = {
  calendarName: string;
  url?: string;
  events: IcsEvent[];
};

export function buildIcsCalendar({ calendarName, url, events }: BuildCalendarOptions): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Utah Esports//utahesports.net//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
  ];
  if (url) lines.push(`URL:${url}`);
  const stamp = formatUtc(new Date());
  for (const event of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${escapeText(event.uid)}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${formatUtc(event.startsAt)}`);
    if (event.endsAt) lines.push(`DTEND:${formatUtc(event.endsAt)}`);
    lines.push(`SUMMARY:${escapeText(event.title)}`);
    if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
    if (event.url) lines.push(`URL:${escapeText(event.url)}`);
    lines.push(`STATUS:${event.status ?? "CONFIRMED"}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
