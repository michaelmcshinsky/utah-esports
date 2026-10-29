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
  utilityLinks,
}: {
  stateSlug: string;
  stateName: string;
  logoSrc: string;
  navItems: Array<{ href: string; label: string }>;
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
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </header>
    </>
  );
}
