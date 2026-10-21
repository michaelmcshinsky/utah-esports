import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="page-container py-10">
      <div className="prose max-w-2xl">
        <h1 className="font-display text-3xl font-bold">About Utah Esports</h1>
        <p className="mt-4 text-charcoal-700">
          Utah Esports is a community-maintained guide to local gaming: tournaments, casual
          meetups, communities, teams, and places to play. It exists to answer three questions
          well — what can I play near me, where does my game gather, and how do I join in.
        </p>
        <p className="mt-3 text-charcoal-700">
          It is not a league, not a sanctioning body, and not a replacement for organizer
          platforms. Registration always happens on the original site. Listings show where
          information came from and when it was last checked, because stale data was the
          problem this project set out to fix.
        </p>
        <p className="mt-3 text-charcoal-700">
          Built in the open on{" "}
          <a
            href="https://github.com/michaelmcshinsky/utah-esports"
            className="text-redrock-600 hover:underline"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          . Corrections welcome — every listing has a Report link.
        </p>
      </div>
    </div>
  );
}
