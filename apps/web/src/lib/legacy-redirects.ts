import { NextResponse } from "next/server";

/**
 * Legacy Jekyll URL redirects. The 2018–2019 site used /streams, /venues,
 * /teams-and-clubs, /social-groups, /calendar, /events/<YYYY-MM-DD-Title>.
 */
const LEGACY_PATHS: Record<string, string> = {
  "/streams": "/communities",
  "/streamers": "/communities",
  "/social-groups": "/communities",
  "/teams-and-clubs": "/schools",
  "/teams": "/schools",
  "/vendors-and-venues": "/places",
  "/vendors": "/places",
  "/calendar": "/explore",
  "/contact": "/organizers",
};

export function legacyRedirect(pathname: string, origin: string): NextResponse | null {
  const mapped = LEGACY_PATHS[pathname.toLowerCase()];
  if (mapped) {
    return NextResponse.redirect(new URL(mapped, origin), 301);
  }
  // Legacy event permalinks: /events/2019-03-01-Prove-It → /events/2019-03-01-prove-it
  const eventMatch = pathname.match(/^\/events\/(\d{4}-\d{2}-\d{2})-(.+)$/);
  if (eventMatch) {
    const rest = eventMatch[2] ?? "";
    const slug = `${eventMatch[1]}-${rest.toLowerCase()}`;
    if (rest !== rest.toLowerCase()) {
      return NextResponse.redirect(new URL(`/events/${slug}`, origin), 301);
    }
  }
  return null;
}
