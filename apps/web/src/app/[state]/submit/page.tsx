import type { Metadata } from "next";
import Link from "next/link";
import { HeroBanner } from "@utah-esports/shared";
import { SubmitEventForm } from "@/src/components/submit-event-form";
import { getStateConfig } from "@/src/lib/states/registry";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const config = getStateConfig(state);
  return {
    title: "Submit an event",
    description: `Add a ${config?.name ?? state} gaming event. Reviewed before publishing.`,
    alternates: { canonical: `/${config?.slug ?? state}/submit` },
  };
}

export default async function StateSubmitPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state } = await params;
  const config = getStateConfig(state);

  return (
    <>
      <HeroBanner
        title="Submit an event"
        subtitle={`Share a tournament, meetup, watch party, workshop, or tryout in ${config?.name ?? state}. A moderator reviews every submission — usually within a couple of days.`}
        backgroundImage={config?.heroImage}
      />

      <section className="section">
        <div className="page-container">
          <div className="mx-auto max-w-2xl">
            <div className="grid gap-3 sm:grid-cols-2">
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
                  <li>It appears on Events, calendars, and feeds</li>
                  <li>You can edit or cancel it from the dashboard</li>
                </ol>
              </div>
            </div>

            <p className="mt-4 text-xs text-charcoal-500">
              Running events regularly? Create an account and an organization first — you&apos;ll
              be able to edit listings, run weekly series, and post announcements to Discord
              yourself.{" "}
              <Link
                href={`/${config?.slug ?? state}/organizers`}
                className="text-redrock-600 hover:underline"
              >
                Learn how it works →
              </Link>
            </p>

            <SubmitEventForm />
          </div>
        </div>
      </section>
    </>
  );
}
