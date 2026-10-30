import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="page-container py-20">
      <div className="mx-auto max-w-lg text-center">
        <p className="font-display text-6xl font-bold text-redrock-500" aria-hidden>
          404
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold text-charcoal-900">
          That page isn&apos;t on the roster
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-charcoal-600">
          The link may be from the old site (we kept redirects for the common paths), or the
          listing was removed. Try a search — most things that exist here are one query away.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/events"
            className="rounded-lg bg-redrock-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-redrock-600"
          >
            Explore events
          </Link>
          <Link
            href="/communities"
            className="rounded-lg border border-charcoal-300 px-4 py-2.5 text-sm font-semibold text-charcoal-800 hover:bg-sandstone-50"
          >
            Communities
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-charcoal-300 px-4 py-2.5 text-sm font-semibold text-charcoal-800 hover:bg-sandstone-50"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
