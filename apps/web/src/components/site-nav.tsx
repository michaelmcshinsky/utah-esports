import Link from "next/link";
import { getSessionUser } from "@/src/lib/session";
import { supabaseServerConfigured } from "@/src/lib/supabase/server";
import { ThemeToggle } from "@/src/components/theme-toggle";

const NAV_ITEMS = [
  { href: "/events", label: "Events" },
  { href: "/deadlines", label: "Deadlines" },
] as const;

const COMMUNITY_LINKS = [
  { href: "/communities", label: "Communities" },
  { href: "/places", label: "Places to Play" },
  { href: "/schools", label: "Schools & Teams" },
  { href: "/organizations", label: "Organizations" },
] as const;

export async function SiteNav() {
  const user = await getSessionUser();
  return (
    <>
      {/* Utility strip */}
      <div className="top-strip">
        <div className="page-container flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1.5 text-xs">
          <span>
            Utah&apos;s gaming home base — tournaments, communities, teams, and places to play
          </span>
          <div className="flex items-center gap-4">
            <a href="/calendar/global.ics" className="ts-link">
              ICS feed
            </a>
            <Link href="/submit" className="ts-link">
              Submit an event
            </Link>
            <Link href="/organizers" className="ts-link">
              How it works
            </Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-charcoal-700/50 bg-charcoal-900/95 text-white backdrop-blur">
        <div className="page-container flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/site/utah-esports-white-2.png"
              alt="Utah Esports"
              className="h-9 w-auto"
            />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal-300 hover:bg-charcoal-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            {/* Community dropdown */}
            <details className="relative">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-charcoal-300 hover:bg-charcoal-800 hover:text-white [&::-webkit-details-marker]:hidden">
                Community
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </summary>
              <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-lg border border-charcoal-700 bg-charcoal-900 py-1.5 shadow-card-hover">
                {COMMUNITY_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg px-4 py-2 text-sm text-charcoal-100 hover:bg-charcoal-800"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </details>
            <Link
              href="/organizers"
              className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal-300 hover:bg-charcoal-800 hover:text-white"
            >
              For Organizers
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/submit"
              className="hidden rounded-lg border border-charcoal-600 px-3 py-2 text-sm font-medium text-charcoal-100 hover:border-charcoal-400 hover:bg-charcoal-800 sm:inline-flex"
            >
              Submit event
            </Link>
            <ThemeToggle />
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-redrock-500 px-3 py-2 text-sm font-medium text-white hover:bg-redrock-600"
              >
                Dashboard
              </Link>
            ) : supabaseServerConfigured() ? (
              <Link
                href="/sign-in"
                className="rounded-lg bg-redrock-500 px-3 py-2 text-sm font-medium text-white hover:bg-redrock-600"
              >
                Sign in
              </Link>
            ) : null}
            <MobileMenu authenticated={Boolean(user)} />
          </div>
        </div>
      </header>
    </>
  );
}

function MobileMenu({ authenticated }: { authenticated: boolean }) {
  return (
    <details className="relative lg:hidden">
      <summary
        className="inline-flex cursor-pointer list-none items-center rounded-lg border border-charcoal-600 px-3 py-2 text-sm font-medium hover:bg-charcoal-800 [&::-webkit-details-marker]:hidden"
        aria-label="Open menu"
      >
        Menu
      </summary>
      <div className="absolute right-0 mt-2 w-56 rounded-lg border border-charcoal-700 bg-charcoal-900 p-2 shadow-card-hover">
        <nav aria-label="Mobile" className="flex flex-col">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-charcoal-100 hover:bg-charcoal-800"
            >
              {item.label}
            </Link>
          ))}
          <span className="mt-1 px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-charcoal-400">
            Community
          </span>
          {COMMUNITY_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-charcoal-100 hover:bg-charcoal-800"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/organizers"
            className="mt-1 rounded-lg px-3 py-2 text-sm text-charcoal-100 hover:bg-charcoal-800"
          >
            For Organizers
          </Link>
          <Link
            href="/submit"
            className="rounded-lg px-3 py-2 text-sm text-charcoal-100 hover:bg-charcoal-800"
          >
            Submit event
          </Link>
          {authenticated ? (
            <>
              <Link
                href="/account"
                className="rounded-lg px-3 py-2 text-sm text-charcoal-100 hover:bg-charcoal-800"
              >
                Account
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2 text-sm text-charcoal-100 hover:bg-charcoal-800"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-lg px-3 py-2 text-sm text-charcoal-100 hover:bg-charcoal-800"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </details>
  );
}
