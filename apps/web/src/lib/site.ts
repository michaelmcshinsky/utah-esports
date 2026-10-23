export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3131";

export const SITE_NAME = "Utah Esports";

export const SITE_TAGLINE = "Your next game starts here.";

export function absoluteUrl(path: string): string {
  return `${SITE_URL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
