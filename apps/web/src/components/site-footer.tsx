import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-charcoal-800 bg-charcoal-900 text-charcoal-300">
      <div className="page-container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/site/utah-esports-white-2.png"
            alt="Utah Esports"
            className="h-9 w-auto"
          />
          <p className="mt-2 text-sm">
            Find something to play, people to play with, and a path into the local competitive
            scene.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-sandstone-100">Discover</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li>
              <Link href="/explore" className="hover:text-white">
                Explore events
              </Link>
            </li>
            <li>
              <Link href="/communities" className="hover:text-white">
                Communities
              </Link>
            </li>
            <li>
              <Link href="/places" className="hover:text-white">
                Places to play
              </Link>
            </li>
            <li>
              <Link href="/schools" className="hover:text-white">
                Schools & teams
              </Link>
            </li>
            <li>
              <Link href="/organizations" className="hover:text-white">
                Organizations
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-sandstone-100">Organizers</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li>
              <Link href="/organizers" className="hover:text-white">
                For organizers
              </Link>
            </li>
            <li>
              <Link href="/submit" className="hover:text-white">
                Submit an event
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-white">
                Dashboard
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-sandstone-100">Site</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li>
              <Link href="/about" className="hover:text-white">
                About
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>
            </li>
            <li>
              <a href="https://github.com/michaelmcshinsky/utah-esports" className="hover:text-white">
                GitHub
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-charcoal-800 py-4 text-center text-xs text-charcoal-400">
        © {new Date().getFullYear()} Utah Esports · Community-maintained ·{" "}
        {/* Plain anchor: <Link> would RSC-prefetch a binary route and 404. */}
        <a href="/calendar/global.ics" download className="underline hover:text-white">
          Subscribe to the calendar
        </a>
      </div>
    </footer>
  );
}
