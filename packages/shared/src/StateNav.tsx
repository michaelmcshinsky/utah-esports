import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

/**
 * State-aware navigation. Derives nav items from the state config.
 * No auth/session — this is a pure UI component.
 */
export function StateNav({
  stateSlug,
  stateName,
  logoSrc,
  navItems,
  communityLinks,
  utilityLinks,
}: {
  stateSlug: string;
  stateName: string;
  logoSrc: string;
  navItems: Array<{ href: string; label: string }>;
  communityLinks?: Array<{ href: string; label: string }>;
  utilityLinks?: Array<{ href: string; label: string }>;
}) {
  return (
    <>
      {utilityLinks && utilityLinks.length > 0 ? (
        <div className="top-strip">
          <div className="page-container flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-1.5 text-xs">
            <span>
              {stateName}&apos;s gaming home base — tournaments, communities, teams, and places to play
            </span>
            <div className="flex items-center gap-4">
              {utilityLinks.map((link) => (
                <a key={link.href} href={link.href} className="ts-link">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 border-b border-charcoal-700/50 bg-charcoal-900/95 text-white backdrop-blur">
        <div className="page-container flex h-16 items-center justify-between gap-4">
          <Link href={`/${stateSlug}`} className="flex items-center gap-2">
            <img src={logoSrc} alt={stateName} className="h-9 w-auto" />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal-300 hover:bg-charcoal-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            {communityLinks && communityLinks.length > 0 ? (
              <details className="relative">
                <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-charcoal-300 hover:bg-charcoal-800 hover:text-white [&::-webkit-details-marker]:hidden">
                  Community
                  <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </summary>
                <div className="absolute left-0 top-full z-50 mt-1 w-52 rounded-lg border border-charcoal-700 bg-charcoal-900 py-1.5 shadow-card-hover">
                  {communityLinks.map((item) => (
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
            ) : null}
            <Link
              href={`/${stateSlug}/organizers`}
              className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal-300 hover:bg-charcoal-800 hover:text-white"
            >
              For Organizers
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>
    </>
  );
}
