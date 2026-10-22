import type { Metadata } from "next";
import { SubmitEventForm } from "@/src/components/submit-event-form";

export const metadata: Metadata = {
  alternates: { canonical: "/submit" },
  title: "Submit an event",
  description: "Add a Utah gaming event to Utah Esports. Reviewed before publishing.",
};

export default function SubmitPage() {
  return (
    <div className="page-container py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-charcoal-900">Submit an event</h1>
        <p className="mt-2 text-charcoal-600">
          Share a tournament, meetup, watch party, workshop, or tryout. A moderator reviews every
          submission — usually within a couple of days — so players only ever see details that
          passed a human check. Include the essentials: when, where, cost, ages, and a link where
          people can actually register.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-card border border-charcoal-200 bg-white p-4 text-sm">
            <p className="font-semibold text-charcoal-900">What gets published fast</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-charcoal-600">
              <li>A real start date, time zone, and city (or “online”)</li>
              <li>A working registration/info link</li>
              <li>Entry price — or “free” — and venue fees</li>
              <li>Age rules for anything youth-related</li>
            </ul>
          </div>
          <div className="rounded-card border border-charcoal-200 bg-white p-4 text-sm">
            <p className="font-semibold text-charcoal-900">What happens next</p>
            <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-charcoal-600">
              <li>Moderator reviews + duplicate check</li>
              <li>You get an email if we need anything</li>
              <li>It appears on Explore, calendars, and feeds</li>
              <li>You can edit or cancel it from the dashboard</li>
            </ol>
          </div>
        </div>

        <p className="mt-4 text-xs text-charcoal-500">
          Running events regularly? Create an account and an organization first — you&apos;ll be
          able to edit listings, run weekly series, and post announcements to Discord yourself.
        </p>

        <SubmitEventForm />
      </div>
    </div>
  );
}
