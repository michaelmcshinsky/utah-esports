import Link from "next/link";
import { getSessionUser } from "@/src/lib/session";
import { supabaseServerConfigured } from "@/src/lib/supabase/server";

const NAV_ITEMS = [
  { href: "/explore", label: "Explore" },
  { href: "/communities", label: "Communities" },
  { href: "/places", label: "Places to Play" },
  { href: "/schools", label: "Schools & Teams" },
  { href: "/organizers", label: "For Organizers" },
] as const;

export async function SiteNav() {
  const user = await getSessionUser();
  return (
    <header className="sticky top-0 z-40 border-b border-charcoal-800/60 bg-charcoal-900/95 text-sandstone-50 backdrop-blur">
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
              className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal-200 hover:bg-charcoal-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/submit"
            className="hidden rounded-lg border border-charcoal-600 px-3 py-2 text-sm font-medium text-charcoal-100 hover:border-charcoal-400 hover:bg-charcoal-800 sm:inline-flex"
          >
            Submit event
          </Link>
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
      <div className="absolute right-0 mt-2 w-56 rounded-card border border-charcoal-700 bg-charcoal-900 p-2 shadow-card-hover">
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
