import type { Metadata } from "next";
import Link from "next/link";
import { HeroBanner } from "@utah-esports/shared";
import { getStateConfig } from "@/src/lib/states/registry";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const config = getStateConfig(state);
  const name = config?.name ?? state;
  return {
    title: "About",
    description: `Why ${name} Esports exists: a community-maintained, freshness-obsessed directory for finding ${name} gaming events, communities, teams, and places to play — and what it deliberately isn't.`,
    alternates: { canonical: `/${config?.slug ?? state}/about` },
    openGraph: {
      title: `About ${name} Esports`,
      description: `A community-maintained directory built so ${name} gaming information stays current — sources, freshness rules, and boundaries explained.`,
    },
  };
}

export default async function StateAboutPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const config = getStateConfig(state);
  const name = config?.name ?? state;
  const base = `/${config?.slug ?? state}`;

  return (
    <>
      <HeroBanner
        title={`About ${name} Esports`}
        subtitle={`A community-maintained guide to local gaming in ${name} — tournaments, casual meetups, communities, teams, and places to play.`}
        backgroundImage={config?.heroImage}
      />

      <section className="section">
        <div className="page-container">
          <article className="mx-auto max-w-2xl space-y-5">
            <p className="text-charcoal-700">
              {name} Esports is a community-maintained guide to local gaming: tournaments, casual
              meetups, communities, teams, and places to play. It exists to answer three questions
              well — <strong>what can I play near me</strong>,{" "}
              <strong>where does my game gather</strong>, and <strong>how do I join in</strong>.
            </p>

            <h2 className="pt-2 text-xl font-semibold text-charcoal-900">
              The problem it solves
            </h2>
            <p className="text-charcoal-700">
              The original Utah Esports site launched in 2018 as a hand-maintained directory and
              eventually froze with events dated 2019 — information that didn&apos;t remain current
              was the failure this rebuild targets. That same freshness-first approach now powers
              each state site. Every listing carries a source and a last-checked timestamp,
              organizers get nudged to re-confirm stale entries, and broken registration links are
              flagged instead of quietly rotting. Freshness isn&apos;t a feature on the side;
              it&apos;s the product.
            </p>

            <h2 className="pt-2 text-xl font-semibold text-charcoal-900">
              What we are (and aren&apos;t)
            </h2>
            <p className="text-charcoal-700">
              We are a <strong>directory and a discovery service</strong> — not a league, not a
              sanctioning body, and not a replacement for organizer platforms. Registration always
              happens on the original site (start.gg, Facebook, the organizer&apos;s own page).
              {" "}{name}&apos;s scholastic and collegiate ecosystems run themselves; we link to
              them rather than imply we operate them. A &quot;claimed&quot; badge means we checked
              ownership, not that we guarantee an event&apos;s safety or quality.
            </p>

            <h2 className="pt-2 text-xl font-semibold text-charcoal-900">
              Where the data comes from
            </h2>
            <ul className="list-disc space-y-1.5 pl-5 text-charcoal-700">
              <li>
                <strong>Organizers</strong> — submissions and dashboard edits (the path we trust
                most)
              </li>
              <li>
                <strong>start.gg</strong> — automatic tournament imports with duplicate review,
                never silent merges
              </li>
              <li>
                <strong>The archive</strong> — migrated venues, communities, teams, and posters,
                all labeled for re-confirmation
              </li>
              <li>
                <strong>Readers like you</strong> — the Report link on every page feeds corrections
                to moderators
              </li>
            </ul>

            <h2 className="pt-2 text-xl font-semibold text-charcoal-900">Built in the open</h2>
            <p className="text-charcoal-700">
              The code lives on{" "}
              <a
                href="https://github.com/michaelmcshinsky/utah-esports"
                className="text-redrock-600 hover:underline"
                rel="noopener noreferrer"
              >
                GitHub
              </a>{" "}
              as a Turborepo monorepo — Next.js, Postgres, background workers, and a Discord bot,
              with CI on every change. Feature requests and bug reports are welcome there.
              Something wrong on a page? Use Report; we&apos;d rather fix it than have you quietly
              work around it.
            </p>

            <p className="text-charcoal-700">
              <Link href={`${base}/events`} className="font-medium text-redrock-600 hover:underline">
                Explore what&apos;s coming up →
              </Link>
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
