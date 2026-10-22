import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For organizers",
  description:
    "Publish your Utah gaming events once — keep players accurate info everywhere. Claims, recurring events, Discord announcements.",
};

export default function OrganizersPage() {
  return (
    <div className="page-container py-10">
      <h1 className="font-display text-3xl font-bold text-charcoal-900">For organizers</h1>
      <p className="mt-2 max-w-2xl text-charcoal-600">
        Stop updating the same event in five places. Claim your organization, maintain one
        listing, and let Utah Esports distribute it — with change tracking and freshness checks
        doing the boring work.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
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
        ].map((feature) => (
          <div key={feature.title} className="rounded-card border border-charcoal-200 bg-white p-5">
            <h2 className="font-semibold text-charcoal-900">{feature.title}</h2>
            <p className="mt-1 text-sm text-charcoal-600">{feature.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/submit"
          className="rounded-lg bg-redrock-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-redrock-600"
        >
          Submit an event
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-charcoal-300 px-5 py-2.5 text-sm font-semibold text-charcoal-800 hover:bg-sandstone-50"
        >
          Open dashboard
        </Link>
      </div>

      <section className="mt-12" aria-labelledby="workflow-heading">
        <h2 id="workflow-heading" className="section-heading">
          How publishing works
        </h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
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
              body: "Edits are field-audited, and followers of your events, org, or games get a single update notice. You keep editing on your own platform of record elsewhere? Just edit here too.",
            },
            {
              title: "Freshness nudges",
              body: "If a listing goes 45 days without confirmation, we email you and mark it needs-verification — one click from the dashboard restores full status.",
            },
            {
              title: "After the event",
              body: "Ended events move to completed (their URLs keep working) and we ask once for corrections. Broken registration links show up in your link-health queue.",
            },
          ].map((s, i) => (
            <li key={s.title} className="rounded-card border border-charcoal-200 bg-white p-5">
              <span className="font-display text-sm font-bold text-redrock-500">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-1 font-semibold text-charcoal-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-charcoal-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 max-w-3xl" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="section-heading">
          Organizer FAQ
        </h2>
        <dl className="mt-4 space-y-4">
          {[
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
          ].map((item) => (
            <div key={item.q} className="border-b border-charcoal-200 pb-4">
              <dt className="font-semibold text-charcoal-900">{item.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-charcoal-600">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-10 max-w-2xl text-sm text-charcoal-600">
        Questions or corrections: every public listing has a Report link, and org owners can reach
        us from the dashboard.
      </p>
    </div>
  );
}
