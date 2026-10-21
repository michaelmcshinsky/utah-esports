import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="page-container py-10">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold">Terms</h1>
        <div className="mt-4 space-y-3 text-sm text-charcoal-700">
          <p>
            Utah Esports lists information supplied by organizers and community members. Event
            details — dates, fees, age rules, registration status — are maintained by the people
            who run them. Always confirm with the organizer before attending or paying.
          </p>
          <p>
            A “claimed” organization badge means ownership was verified, not that the site
            guarantees an event&apos;s safety or quality.
          </p>
          <p>
            Don&apos;t submit listings you don&apos;t have the right to share, and don&apos;t use
            report forms for harassment. Violations may be removed.
          </p>
        </div>
      </div>
    </div>
  );
}
