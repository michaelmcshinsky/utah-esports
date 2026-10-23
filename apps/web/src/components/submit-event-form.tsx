"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Checkbox, Input, Select, Textarea } from "@utah-esports/ui";
import {
  submitEventFormSchema,
  type SubmitEventFormValues,
} from "@/src/lib/forms/schemas";

const EVENT_TYPE_OPTIONS = [
  { value: "tournament", label: "Tournament" },
  { value: "casual", label: "Casual session" },
  { value: "watch_party", label: "Watch party" },
  { value: "workshop", label: "Workshop" },
  { value: "tryout", label: "Tryout" },
  { value: "league", label: "League" },
  { value: "other", label: "Other" },
];

/** ISO → datetime-local value for <input type="datetime-local">. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type PreviewDraft = {
  title: string;
  description: string;
  url: string;
  eventType: SubmitEventFormValues["eventType"];
  format: SubmitEventFormValues["format"];
  startsAt: string | null;
  endsAt: string | null;
  gameNames: string;
  city: string;
  priceDollars: string;
  registrationState: SubmitEventFormValues["registrationState"];
  contactName: string;
  contactEmail: string;
  venueName: string | null;
};

export function SubmitEventForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [importState, setImportState] = useState<"idle" | "loading" | "done" | "failed">("idle");
  const [importNote, setImportNote] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SubmitEventFormValues>({
    resolver: zodResolver(submitEventFormSchema),
    defaultValues: {
      title: "",
      url: "",
      eventType: "casual",
      format: "in_person",
      startsAt: "",
      endsAt: "",
      gameNames: "",
      city: "",
      agePolicy: "unknown",
      skillLevel: "unknown",
      beginnerFriendly: false,
      youthProgram: false,
      priceDollars: "",
      registrationState: "open",
      description: "",
      contactName: "",
      contactEmail: "",
      notes: "",
    },
  });

  /** Pull metadata from the pasted URL and autofill the form. */
  async function importFromUrl() {
    const url = getValues("url")?.trim();
    if (!/^https?:\/\//i.test(url ?? "")) {
      setImportState("failed");
      setImportNote("Paste a full event URL (https://…) first.");
      return;
    }
    setImportState("loading");
    setImportNote(null);
    const res = await fetch("/api/submissions/preview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const body = (await res.json().catch(() => null)) as
      | { error?: string; draft?: PreviewDraft; adapter?: string }
      | null;
    if (!res.ok || !body?.draft) {
      setImportState("failed");
      setImportNote(body?.error ?? "Couldn't read event details — fill the form manually.");
      return;
    }
    const d = body.draft;
    setValue("title", d.title);
    setValue("description", d.description);
    setValue("eventType", d.eventType);
    setValue("format", d.format);
    setValue("startsAt", toLocalInput(d.startsAt));
    setValue("endsAt", toLocalInput(d.endsAt));
    setValue("gameNames", d.gameNames);
    setValue("city", d.city);
    setValue("priceDollars", d.priceDollars);
    setValue("registrationState", d.registrationState);
    if (d.contactName) setValue("contactName", d.contactName);
    if (d.contactEmail) setValue("contactEmail", d.contactEmail);
    setImportState("done");
    setImportNote(
      `Imported from ${body.adapter}${d.venueName ? ` · venue: ${d.venueName}` : ""} — review everything before submitting.`,
    );
  }

  async function onSubmit(values: SubmitEventFormValues) {
    setStatus("sending");
    const payload = {
      title: values.title,
      description: values.description?.trim() || null,
      url: values.url,
      eventType: values.eventType,
      format: values.format,
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: values.endsAt ? new Date(values.endsAt).toISOString() : null,
      gameNames: values.gameNames
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      city: values.city?.trim() || null,
      onlineUrl: values.format === "online" ? values.url : null,
      agePolicy: values.agePolicy,
      skillLevel: values.skillLevel,
      beginnerFriendly: values.beginnerFriendly,
      youthProgram: values.youthProgram,
      priceCents: values.priceDollars ? Math.round(Number(values.priceDollars) * 100) : null,
      registrationUrl: values.url || null,
      registrationState: values.registrationState,
      contactName: values.contactName,
      contactEmail: values.contactEmail,
      notes: values.notes?.trim() || null,
    };

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setStatus("sent");
      return;
    }
    const body = (await res.json().catch(() => null)) as {
      issues?: Array<{ path: (string | number)[]; message: string }>;
    } | null;
    if (body?.issues?.length) {
      for (const issue of body.issues) {
        const path = String(issue.path[0] ?? "");
        if (path === "startsAt" || path === "url" || path === "gameNames") {
          setError(path as keyof SubmitEventFormValues, { message: issue.message });
        } else {
          setError("root", { message: issue.message });
        }
      }
    } else {
      setError("root", { message: "Something went wrong. Try again." });
    }
    setStatus("error");
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
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
      <Input label="Event title" error={errors.title?.message} {...register("title")} />
      <Input
        label="Registration / info link"
        type="url"
        hint="start.gg, Facebook, or your own page"
        error={errors.url?.message}
        {...register("url")}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={importFromUrl}
          disabled={importState === "loading"}
        >
          {importState === "loading" ? "Reading link…" : "Fetch details from link"}
        </Button>
        {importNote ? (
          <span
            role="status"
            className={`text-xs ${importState === "failed" ? "text-danger-600" : "text-charcoal-600"}`}
          >
            {importNote}
          </span>
        ) : (
          <span className="text-xs text-charcoal-500">
            Paste a start.gg or event-page URL, then fetch to autofill.
          </span>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Event type"
          options={EVENT_TYPE_OPTIONS}
          error={errors.eventType?.message}
          {...register("eventType")}
        />
        <Select
          label="Format"
          options={[
            { value: "in_person", label: "In person" },
            { value: "online", label: "Online" },
            { value: "hybrid", label: "Hybrid" },
          ]}
          error={errors.format?.message}
          {...register("format")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Starts" type="datetime-local" error={errors.startsAt?.message} {...register("startsAt")} />
        <Input label="Ends (optional)" type="datetime-local" error={errors.endsAt?.message} {...register("endsAt")} />
      </div>
      <Input
        label="Games"
        hint="Comma-separated, e.g. Smash Ultimate, Rocket League"
        error={errors.gameNames?.message}
        {...register("gameNames")}
      />
      <Input label="City" hint="Leave blank for online events" error={errors.city?.message} {...register("city")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Age policy"
          options={[
            { value: "all_ages", label: "All ages" },
            { value: "teen", label: "Teens" },
            { value: "18_plus", label: "18+" },
            { value: "21_plus", label: "21+" },
            { value: "unknown", label: "Not specified" },
          ]}
          error={errors.agePolicy?.message}
          {...register("agePolicy")}
        />
        <Select
          label="Skill level"
          options={[
            { value: "beginner_friendly", label: "Beginner-friendly" },
            { value: "open", label: "Open" },
            { value: "intermediate", label: "Intermediate" },
            { value: "advanced", label: "Advanced" },
            { value: "competitive", label: "Competitive" },
            { value: "unknown", label: "Not specified" },
          ]}
          error={errors.skillLevel?.message}
          {...register("skillLevel")}
        />
      </div>
      <Input
        label="Entry price (USD)"
        type="number"
        step="0.01"
        min="0"
        hint="Leave blank if free or unknown"
        error={errors.priceDollars?.message}
        {...register("priceDollars")}
      />
      <Select
        label="Registration state"
        options={[
          { value: "open", label: "Open" },
          { value: "closing_soon", label: "Closing soon" },
          { value: "closed", label: "Closed" },
          { value: "unknown", label: "Not sure" },
        ]}
        error={errors.registrationState?.message}
        {...register("registrationState")}
      />
      <Checkbox label="Beginner-friendly" {...register("beginnerFriendly")} />
      <Checkbox label="Youth program (adult-supervised)" {...register("youthProgram")} />
      <Textarea
        label="Description"
        rows={5}
        hint="What should players expect? Format, rules highlights, first-timer notes."
        error={errors.description?.message}
        {...register("description")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Contact name" error={errors.contactName?.message} {...register("contactName")} />
        <Input label="Contact email" type="email" error={errors.contactEmail?.message} {...register("contactEmail")} />
      </div>
      <Textarea label="Notes for moderators" rows={3} error={errors.notes?.message} {...register("notes")} />
      {errors.root?.message ? (
        <Alert variant="danger" title="Submission failed">
          {errors.root.message}
        </Alert>
      ) : null}
      <Button type="submit" disabled={isSubmitting || status === "sending"}>
        {status === "sending" ? "Submitting…" : "Submit for review"}
      </Button>
    </form>
  );
}
