import type { Metadata } from "next";
import { SubmitEventForm } from "@/src/components/submit-event-form";

export const metadata: Metadata = {
  title: "Submit an event",
  description: "Add a Utah gaming event to Utah Esports. Reviewed before publishing.",
};

export default function SubmitPage() {
  return (
    <div className="page-container py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-charcoal-900">Submit an event</h1>
        <p className="mt-2 text-charcoal-600">
          Share a tournament, meetup, watch party, workshop, or tryout. A moderator reviews
          every submission — usually within a couple of days. Include the essentials players
          need: when, where, cost, ages, and a registration link.
        </p>
        <SubmitEventForm />
      </div>
    </div>
  );
}
