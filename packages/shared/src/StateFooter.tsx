import Link from "next/link";

/**
 * State-aware footer. Derives links from the state config.
 */
export function StateFooter({
  stateSlug,
  stateName,
  logoSrc,
  socials,
  icsFeedHref,
}: {
  stateSlug: string;
  stateName: string;
  logoSrc: string;
  socials?: Array<{ label: string; href: string }>;
  icsFeedHref?: string;
}) {
  return (
    <footer className="mt-16 border-t border-charcoal-800 bg-charcoal-900 text-charcoal-300">
      <div className="page-container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src={logoSrc} alt={stateName} className="h-9 w-auto" />
          <p className="mt-3 text-sm leading-relaxed">
            Find something to play, people to play with, and a path into the local competitive
            scene.
          </p>
          {socials && socials.length > 0 ? (
            <div className="mt-4 flex gap-3">
              {socials.map((s) => (
                <a key={s.href} href={s.href} className="text-charcoal-400 hover:text-white" aria-label={s.label}>
                  {s.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Discover</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href={`/${stateSlug}/events`} className="hover:text-white">Events</Link></li>
            <li><Link href={`/${stateSlug}/deadlines`} className="hover:text-white">Deadlines</Link></li>
            <li><Link href={`/${stateSlug}/communities`} className="hover:text-white">Communities</Link></li>
            <li><Link href={`/${stateSlug}/places`} className="hover:text-white">Places to play</Link></li>
            <li><Link href={`/${stateSlug}/schools`} className="hover:text-white">Schools & teams</Link></li>
            <li><Link href={`/${stateSlug}/organizations`} className="hover:text-white">Organizations</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Organizers</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href={`/${stateSlug}/organizers`} className="hover:text-white">For organizers</Link></li>
            <li><Link href={`/${stateSlug}/submit`} className="hover:text-white">Submit an event</Link></li>
            <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Site</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href={`/${stateSlug}/about`} className="hover:text-white">About</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
            {icsFeedHref ? (
              <li><a href={icsFeedHref} download className="hover:text-white">Calendar feed</a></li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-charcoal-800 py-4 text-center text-xs text-charcoal-400">
        © {new Date().getFullYear()} {stateName} · Community-maintained
      </div>
    </footer>
  );
}
