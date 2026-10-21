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

      <p className="mt-8 max-w-2xl text-sm text-charcoal-600">
        Basic listings and corrections stay free — forever. Paid tools (if they ever exist) will
        save you administrative work, never gate accuracy.
      </p>
    </div>
  );
}
