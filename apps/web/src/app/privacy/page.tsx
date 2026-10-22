import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/privacy" },
  title: "Privacy",
  description:
    "How Utah Esports handles accounts, preferences, outbound-click counts, and data for minors — plain language, no tracking pixels.",
};

export default function PrivacyPage() {
  return (
    <div className="page-container py-10">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold">Privacy</h1>
        <div className="mt-4 space-y-3 text-sm text-charcoal-700">
          <p>
            Browsing works without an account. We store outbound-click counts as a rough measure
            of whether listings help people participate — not for cross-site tracking.
          </p>
          <p>
            Accounts (email, optional display name, preferences) exist to power saves, follows,
            and notifications. We do not sell data. Public pages never show home addresses or
            personal contact details for minors.
          </p>
          <p>
            This page is a plain-language summary, not legal advice. A fuller policy will ship
            before any sensitive youth-account features launch, following qualified legal review.
          </p>
        </div>
      </div>
    </div>
  );
}
