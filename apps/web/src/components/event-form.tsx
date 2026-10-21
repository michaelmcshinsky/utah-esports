"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Textarea, Checkbox, Alert } from "@utah-esports/ui";

export type EventFormValues = {
  id?: string;
  title: string;
  description: string;
  url: string;
  eventType: string;
  format: string;
  startsAt: string;
  endsAt: string;
  gameNames: string;
  city: string;
  agePolicy: string;
  skillLevel: string;
  beginnerFriendly: boolean;
  youthProgram: boolean;
  priceDollars: string;
  registrationState: string;
  registrationDeadline: string;
  contactName: string;
  contactEmail: string;
  status: string;
};

export function EventForm({
  orgSlug,
  values,
}: {
  orgSlug: string;
  values?: EventFormValues;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const payload = {
      title: data.get("title"),
      description: data.get("description") || null,
      url: data.get("url"),
      eventType: data.get("eventType"),
      format: data.get("format"),
      startsAt: new Date(String(data.get("startsAt"))).toISOString(),
      endsAt: data.get("endsAt") ? new Date(String(data.get("endsAt"))).toISOString() : null,
      gameNames: String(data.get("gameNames") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      city: data.get("city") || null,
      agePolicy: data.get("agePolicy"),
      skillLevel: data.get("skillLevel"),
      beginnerFriendly: data.get("beginnerFriendly") === "on",
      youthProgram: data.get("youthProgram") === "on",
      priceCents: data.get("priceDollars")
        ? Math.round(Number(String(data.get("priceDollars"))) * 100)
        : null,
      registrationUrl: data.get("url") || null,
      registrationState: data.get("registrationState"),
      registrationDeadline: data.get("registrationDeadline")
        ? new Date(String(data.get("registrationDeadline"))).toISOString()
        : null,
      contactName: data.get("contactName"),
      contactEmail: data.get("contactEmail"),
      status: data.get("status"),
      recurrenceHint: data.get("repeatWeekly") === "on" ? String(data.get("recurrenceHint") || "Weekly") : null,
      seriesEndsOn: data.get("repeatWeekly") === "on" ? String(data.get("seriesEndsOn") || "") || null : null,
    };
    const res = await fetch(
      values?.id ? `/api/events/${values.id}` : "/api/events",
      {
        method: values?.id ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, organizationSlug: orgSlug }),
      },
    );
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      router.push(`/dashboard/org/${orgSlug}/events`);
      router.refresh();
      void body;
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not save event");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-2xl space-y-4">
      <Input label="Title" name="title" required defaultValue={values?.title} />
      <Input
        label="Registration / info link"
        name="url"
        type="url"
        required
        defaultValue={values?.url}
        hint="Where players register — start.gg, Facebook, your site"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Type"
          name="eventType"
          defaultValue={values?.eventType ?? "casual"}
          options={[
            { value: "tournament", label: "Tournament" },
            { value: "casual", label: "Casual session" },
            { value: "watch_party", label: "Watch party" },
            { value: "workshop", label: "Workshop" },
            { value: "tryout", label: "Tryout" },
            { value: "league", label: "League" },
            { value: "other", label: "Other" },
          ]}
        />
        <Select
          label="Format"
          name="format"
          defaultValue={values?.format ?? "in_person"}
          options={[
            { value: "in_person", label: "In person" },
            { value: "online", label: "Online" },
            { value: "hybrid", label: "Hybrid" },
          ]}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Starts" name="startsAt" type="datetime-local" required defaultValue={values?.startsAt} />
        <Input label="Ends" name="endsAt" type="datetime-local" defaultValue={values?.endsAt} />
      </div>
      <Input
        label="Games"
        name="gameNames"
        required
        defaultValue={values?.gameNames}
        hint="Comma-separated"
      />
      <Input label="City" name="city" defaultValue={values?.city} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Age policy"
          name="agePolicy"
          defaultValue={values?.agePolicy ?? "unknown"}
          options={[
            { value: "all_ages", label: "All ages" },
            { value: "teen", label: "Teens" },
            { value: "18_plus", label: "18+" },
            { value: "21_plus", label: "21+" },
            { value: "unknown", label: "Not specified" },
          ]}
        />
        <Select
          label="Skill"
          name="skillLevel"
          defaultValue={values?.skillLevel ?? "unknown"}
          options={[
            { value: "beginner_friendly", label: "Beginner-friendly" },
            { value: "open", label: "Open" },
            { value: "competitive", label: "Competitive" },
            { value: "unknown", label: "Not specified" },
          ]}
        />
      </div>
      <Input
        label="Entry price (USD)"
        name="priceDollars"
        type="number"
        step="0.01"
        min="0"
        defaultValue={values?.priceDollars}
      />
      <Select
        label="Registration"
        name="registrationState"
        defaultValue={values?.registrationState ?? "open"}
        options={[
          { value: "open", label: "Open" },
          { value: "closing_soon", label: "Closing soon" },
          { value: "closed", label: "Closed" },
          { value: "unknown", label: "Unknown" },
        ]}
      />
      <Input
        label="Registration deadline"
        name="registrationDeadline"
        type="datetime-local"
        defaultValue={values?.registrationDeadline}
      />
      <Checkbox
        label="Beginner-friendly"
        name="beginnerFriendly"
        defaultChecked={values?.beginnerFriendly}
      />
      <Checkbox label="Youth program" name="youthProgram" defaultChecked={values?.youthProgram} />
      <Textarea
        label="Description"
        name="description"
        rows={5}
        defaultValue={values?.description}
        hint="What players should know — format, rules, first-timer notes"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Contact name" name="contactName" required defaultValue={values?.contactName} />
        <Input label="Contact email" name="contactEmail" type="email" required defaultValue={values?.contactEmail} />
      </div>
      {values?.id ? null : (
        <fieldset className="rounded-lg border border-charcoal-200 p-4">
          <Checkbox
            label="Repeat weekly (series)"
            name="repeatWeekly"
            hint="Generates dated occurrences automatically; individual nights can be cancelled safely."
          />
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Input
              label="Recurrence description"
              name="recurrenceHint"
              placeholder="Every Thursday 7pm"
              hint="Shown on the listing"
            />
            <Input label="Series ends (optional)" name="seriesEndsOn" type="date" />
          </div>
        </fieldset>
      )}
      {values?.id ? (
        <Select
          label="Status"
          name="status"
          defaultValue={values.status ?? "draft"}
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "postponed", label: "Postponed" },
            { value: "cancelled", label: "Cancelled" },
            { value: "completed", label: "Completed" },
            { value: "needs_verification", label: "Needs verification" },
          ]}
        />
      ) : null}
      {error ? (
        <Alert variant="danger" title="Save failed">
          {error}
        </Alert>
      ) : null}
      <Button type="submit" disabled={busy}>
        {busy ? "Saving…" : values?.id ? "Save changes" : "Create event"}
      </Button>
    </form>
  );
}
