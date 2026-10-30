import type { Metadata } from "next";
import Link from "next/link";
import { HeroBanner, SectionTitle } from "@utah-esports/shared";
import { getStateConfig } from "@/src/lib/states/registry";

const FEATURES = [
  {
    title: "Claim your org",
    body: "Prove affiliation with a public link, get editor access, and manage your listing.",
  },
  {
    title: "Recurring events",
    body: "Create a weekly series once — dated occurrences generate automatically, and a single night can be cancelled safely.",
  },
  {
    title: "Source-backed imports",
    body: "start.gg tournaments sync automatically with duplicate review — never silent merges.",
  },
  {
    title: "Discord announcements",
    body: "Authorize a channel and new events post there automatically. You control the destination.",
  },
  {
    title: "Freshness built in",
    body: "Listings age; we ask you to confirm. Players see when info was last checked.",
  },
  {
    title: "See what works",
    body: "Outbound registration clicks show discovery interest — labeled as a proxy, not attendance.",
  },
] as const;

const WORKFLOW = [
  {
    title: "Submit or create",
    body: "Paste an event URL on the public form, or build the listing yourself in the dashboard. Weekly series are created once and materialize dated occurrences automatically.",
  },
  {
    title: "Moderator review",
    body: "A human checks the essentials — when, where, cost, ages, register link — and duplicate detection flags likely matches so nothing double-posts.",
  },
  {
    title: "Publish everywhere",
    body: "The public page, calendar feeds, and your embeddable widget update from one record. Authorized Discord channels get the announcement automatically.",
  },
  {
    title: "Changes propagate",
    body: "Edits are field-audited, and followers of your events, org, or games get a single update notice.",
  },
  {
    title: "Freshness nudges",
    body: "If a listing goes 45 days without confirmation, we email you and mark it needs-verification — one click from the dashboard restores full status.",
  },
  {
    title: "After the event",
    body: "Ended events move to completed (their URLs keep working) and we ask once for corrections. Broken registration links show up in your link-health queue.",
  },
] as const;

const FAQ = [
  {
    q: "Do I have to move registration here?",
    a: "No — and please don't. Registration stays on start.gg, Facebook, or your own site; we link out and track the click so you keep your tools and we keep discovery.",
  },
  {
    q: "What does it cost?",
    a: "Basic listings, corrections, and safety information are free permanently. If paid tiers ever exist, they'll save measurable admin work — they'll never gate keeping a listing accurate.",
  },
  {
    q: "Can I manage a team or a school program too?",
    a: "Yes. Organizations can host events, teams, and school programs together; roles (owner/editor/viewer) control who can edit. Schools should link official contacts only.",
  },
  {
    q: "What about minors?",
    a: "Youth events must state age rules and use official organizational contacts — no public personal contact details for minors, ever. We'll reject submissions that don't follow this.",
  },
  {
    q: "Will my Facebook event import automatically?",
    a: "Not yet. Paste its URL on the submit form (we keep the source link) or maintain the listing directly. start.gg tournaments sync automatically when a token is configured.",
  },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const config = getStateConfig(state);
  return {
    title: "For organizers",
    description: `Publish your ${config?.name ?? state} gaming events once — keep players accurate info everywhere. Claims, recurring events, Discord announcements.`,
    alternates: { canonical: `/${config?.slug ?? state}/organizers` },
  };
}

export default async function StateOrganizersPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const config = getStateConfig(state);
  const base = `/${config?.slug ?? state}`;

  return (
    <>
      <HeroBanner
        title="For organizers"
        subtitle="Claim your organization, maintain one listing, and let us distribute it — with change tracking and freshness checks doing the boring work."
        backgroundImage={config?.heroImage}
      >
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`${base}/submit`}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-charcoal-900 hover:bg-white/90"
          >
            Submit an event
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/40 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Open dashboard
          </Link>
        </div>
      </HeroBanner>

      <section className="section" aria-labelledby="features-heading">
        <div className="page-container">
          <SectionTitle id="features-heading">What you get</SectionTitle>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="rounded-card border border-charcoal-200 bg-white p-5">
                <h3 className="font-semibold text-charcoal-900">{feature.title}</h3>
                <p className="mt-1 text-sm text-charcoal-600">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-light" aria-labelledby="workflow-heading">
        <div className="page-container">
          <SectionTitle id="workflow-heading">How publishing works</SectionTitle>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WORKFLOW.map((step, i) => (
              <li key={step.title} className="rounded-card border border-charcoal-200 bg-white p-5">
                <span className="font-display text-sm font-bold text-redrock-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 font-semibold text-charcoal-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-charcoal-600">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" aria-labelledby="faq-heading">
        <div className="page-container max-w-3xl">
          <SectionTitle id="faq-heading">Organizer FAQ</SectionTitle>
          <dl className="mt-8 space-y-4">
            {FAQ.map((item) => (
              <div key={item.q} className="border-b border-charcoal-200 pb-4">
                <dt className="font-semibold text-charcoal-900">{item.q}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-charcoal-600">{item.a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-sm text-charcoal-600">
            Questions or corrections: every public listing has a Report link, and org owners can
            reach us from the dashboard.
          </p>
        </div>
      </section>
    </>
  );
}
