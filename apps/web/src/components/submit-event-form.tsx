"use client";

import { useState, type FormEvent } from "react";
import { Alert, Button, Checkbox, Input, Select, Textarea } from "@utah-esports/ui";
import { eventSubmissionSchema } from "@utah-esports/core";

const EVENT_TYPE_OPTIONS = [
  { value: "tournament", label: "Tournament" },
  { value: "casual", label: "Casual session" },
  { value: "watch_party", label: "Watch party" },
  { value: "workshop", label: "Workshop" },
  { value: "tryout", label: "Tryout" },
  { value: "league", label: "League" },
  { value: "other", label: "Other" },
];

export function SubmitEventForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrors({});
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? "") || null,
      url: String(data.get("url") ?? ""),
      eventType: String(data.get("eventType") ?? "casual"),
      format: String(data.get("format") ?? "in_person"),
      startsAt: new Date(String(data.get("startsAt") ?? "")).toISOString(),
      endsAt: data.get("endsAt") ? new Date(String(data.get("endsAt"))).toISOString() : null,
      gameNames: String(data.get("gameNames") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      city: String(data.get("city") ?? "") || null,
      onlineUrl: data.get("format") === "online" ? String(data.get("url") ?? "") : null,
      agePolicy: String(data.get("agePolicy") ?? "unknown"),
      skillLevel: String(data.get("skillLevel") ?? "unknown"),
      beginnerFriendly: data.get("beginnerFriendly") === "on",
      youthProgram: data.get("youthProgram") === "on",
      priceCents: data.get("priceDollars")
        ? Math.round(Number(String(data.get("priceDollars"))) * 100)
        : null,
      registrationUrl: String(data.get("url") ?? "") || null,
      registrationState: String(data.get("registrationState") ?? "unknown"),
      contactName: String(data.get("contactName") ?? ""),
      contactEmail: String(data.get("contactEmail") ?? ""),
      notes: String(data.get("notes") ?? "") || null,
    };

    const parsed = eventSubmissionSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        fieldErrors[key] ??= issue.message;
      }
      setErrors(fieldErrors);
      setStatus("error");
      return;
    }

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    if (res.ok) {
      setStatus("sent");
      form.reset();
    } else {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <Alert variant="success" title="Submitted" className="mt-6">
        Thanks! Your event is in the review queue. We&apos;ll email you if moderators need more
        detail.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <Input label="Event title" name="title" required error={errors.title} />
      <Input
        label="Registration / info link"
        name="url"
        type="url"
        required
        hint="start.gg, Facebook, or your own page"
        error={errors.url}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Event type" name="eventType" options={EVENT_TYPE_OPTIONS} required />
        <Select
          label="Format"
          name="format"
          required
          options={[
            { value: "in_person", label: "In person" },
            { value: "online", label: "Online" },
            { value: "hybrid", label: "Hybrid" },
          ]}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Starts" name="startsAt" type="datetime-local" required error={errors.startsAt} />
        <Input label="Ends (optional)" name="endsAt" type="datetime-local" />
      </div>
      <Input
        label="Games"
        name="gameNames"
        required
        hint="Comma-separated, e.g. Smash Ultimate, Rocket League"
        error={errors.gameNames}
      />
      <Input label="City" name="city" hint="Leave blank for online events" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Age policy"
          name="agePolicy"
          options={[
            { value: "all_ages", label: "All ages" },
            { value: "teen", label: "Teens" },
            { value: "18_plus", label: "18+" },
            { value: "21_plus", label: "21+" },
            { value: "unknown", label: "Not specified" },
          ]}
        />
        <Select
          label="Skill level"
          name="skillLevel"
          options={[
            { value: "beginner_friendly", label: "Beginner-friendly" },
            { value: "open", label: "Open" },
            { value: "intermediate", label: "Intermediate" },
            { value: "advanced", label: "Advanced" },
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
        hint="Leave blank if free or unknown"
        error={errors.priceCents}
      />
      <Select
        label="Registration state"
        name="registrationState"
        options={[
          { value: "open", label: "Open" },
          { value: "closing_soon", label: "Closing soon" },
          { value: "closed", label: "Closed" },
          { value: "unknown", label: "Not sure" },
        ]}
      />
      <Checkbox label="Beginner-friendly" name="beginnerFriendly" />
      <Checkbox label="Youth program (adult-supervised)" name="youthProgram" />
      <Textarea
        label="Description"
        name="description"
        rows={5}
        hint="What should players expect? Format, rules highlights, first-timer notes."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Contact name" name="contactName" required error={errors.contactName} />
        <Input label="Contact email" name="contactEmail" type="email" required error={errors.contactEmail} />
      </div>
      <Textarea label="Notes for moderators" name="notes" rows={3} />
      {status === "error" && Object.keys(errors).length === 0 ? (
        <Alert variant="danger" title="Submission failed">
          Something went wrong. Try again, or check that all fields are valid.
        </Alert>
      ) : null}
      <Button type="submit" size="lg" disabled={status === "sending"}>
        {status === "sending" ? "Submitting…" : "Submit for review"}
      </Button>
    </form>
  );
}
