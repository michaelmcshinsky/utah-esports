"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Alert, Button, Checkbox, Input, Select, Textarea } from "@utah-esports/ui";
import { eventFormSchema, type EventFormValues } from "@/src/lib/forms/schemas";

export type EventFormProps = {
  orgSlug: string;
  values?: Partial<EventFormValues> & { id?: string };
};

export function EventForm({ orgSlug, values }: EventFormProps) {
  const isEdit = Boolean(values?.id);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: values?.title ?? "",
      url: values?.url ?? "",
      eventType: values?.eventType ?? "casual",
      format: values?.format ?? "in_person",
      startsAt: values?.startsAt ?? "",
      endsAt: values?.endsAt ?? "",
      gameNames: values?.gameNames ?? "",
      city: values?.city ?? "",
      agePolicy: values?.agePolicy ?? "unknown",
      skillLevel: values?.skillLevel ?? "unknown",
      beginnerFriendly: values?.beginnerFriendly ?? false,
      youthProgram: values?.youthProgram ?? false,
      priceDollars: values?.priceDollars ?? "",
      registrationState: values?.registrationState ?? "open",
      registrationDeadline: values?.registrationDeadline ?? "",
      description: values?.description ?? "",
      contactName: values?.contactName ?? "",
      contactEmail: values?.contactEmail ?? "",
      status: values?.status ?? "draft",
      repeatWeekly: false,
      recurrenceHint: values?.recurrenceHint ?? "",
      seriesEndsOn: values?.seriesEndsOn ?? "",
    },
  });

  async function onSubmit(formValues: EventFormValues) {
    const payload = {
      organizationSlug: orgSlug,
      title: formValues.title,
      description: formValues.description?.trim() || null,
      url: formValues.url,
      eventType: formValues.eventType,
      format: formValues.format,
      startsAt: new Date(formValues.startsAt).toISOString(),
      endsAt: formValues.endsAt ? new Date(formValues.endsAt).toISOString() : null,
      gameNames: formValues.gameNames
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      city: formValues.city?.trim() || null,
      agePolicy: formValues.agePolicy,
      skillLevel: formValues.skillLevel,
      beginnerFriendly: formValues.beginnerFriendly,
      youthProgram: formValues.youthProgram,
      priceCents: formValues.priceDollars ? Math.round(Number(formValues.priceDollars) * 100) : null,
      registrationUrl: formValues.url || null,
      registrationState: formValues.registrationState,
      registrationDeadline: formValues.registrationDeadline
        ? new Date(formValues.registrationDeadline).toISOString()
        : null,
      contactName: formValues.contactName,
      contactEmail: formValues.contactEmail,
      status: formValues.status,
      recurrenceHint: !isEdit && formValues.repeatWeekly
        ? formValues.recurrenceHint?.trim() || "Weekly"
        : null,
      seriesEndsOn: !isEdit && formValues.repeatWeekly ? formValues.seriesEndsOn || null : null,
    };

    const res = await fetch(isEdit ? `/api/events/${values?.id}` : "/api/events", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      router.push(`/dashboard/org/${orgSlug}/events`);
      router.refresh();
      return;
    }
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    setError("root", { message: body?.error ?? "Could not save event" });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 max-w-2xl space-y-4" noValidate>
      <Input label="Title" error={errors.title?.message} {...register("title")} />
      <Input
        label="Registration / info link"
        type="url"
        hint="Where players register — start.gg, Facebook, your site"
        error={errors.url?.message}
        {...register("url")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Type"
          options={[
            { value: "tournament", label: "Tournament" },
            { value: "casual", label: "Casual session" },
            { value: "watch_party", label: "Watch party" },
            { value: "workshop", label: "Workshop" },
            { value: "tryout", label: "Tryout" },
            { value: "league", label: "League" },
            { value: "other", label: "Other" },
          ]}
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
        <Input label="Ends" type="datetime-local" error={errors.endsAt?.message} {...register("endsAt")} />
      </div>
      <Input
        label="Games"
        hint="Comma-separated"
        error={errors.gameNames?.message}
        {...register("gameNames")}
      />
      <Input label="City" error={errors.city?.message} {...register("city")} />
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
          label="Skill"
          options={[
            { value: "beginner_friendly", label: "Beginner-friendly" },
            { value: "open", label: "Open" },
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
        error={errors.priceDollars?.message}
        {...register("priceDollars")}
      />
      <Select
        label="Registration"
        options={[
          { value: "open", label: "Open" },
          { value: "closing_soon", label: "Closing soon" },
          { value: "closed", label: "Closed" },
          { value: "unknown", label: "Unknown" },
        ]}
        error={errors.registrationState?.message}
        {...register("registrationState")}
      />
      <Input
        label="Registration deadline"
        type="datetime-local"
        error={errors.registrationDeadline?.message}
        {...register("registrationDeadline")}
      />
      <Checkbox label="Beginner-friendly" {...register("beginnerFriendly")} />
      <Checkbox label="Youth program" {...register("youthProgram")} />
      <Textarea
        label="Description"
        rows={5}
        hint="What players should know — format, rules, first-timer notes."
        error={errors.description?.message}
        {...register("description")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Contact name" error={errors.contactName?.message} {...register("contactName")} />
        <Input label="Contact email" type="email" error={errors.contactEmail?.message} {...register("contactEmail")} />
      </div>
      {isEdit ? (
        <Select
          label="Status"
          options={[
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
            { value: "postponed", label: "Postponed" },
            { value: "cancelled", label: "Cancelled" },
            { value: "completed", label: "Completed" },
            { value: "needs_verification", label: "Needs verification" },
          ]}
          error={errors.status?.message}
          {...register("status")}
        />
      ) : (
        <fieldset className="rounded-lg border border-charcoal-200 p-4">
          <Checkbox label="Repeat weekly (series)" {...register("repeatWeekly")} />
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Input
              label="Recurrence description"
              placeholder="Every Thursday 7pm"
              hint="Shown on the listing"
              error={errors.recurrenceHint?.message}
              {...register("recurrenceHint")}
            />
            <Input
              label="Series ends (optional)"
              type="date"
              error={errors.seriesEndsOn?.message}
              {...register("seriesEndsOn")}
            />
          </div>
        </fieldset>
      )}
      {errors.root?.message ? (
        <Alert variant="danger" title="Save failed">
          {errors.root.message}
        </Alert>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create event"}
      </Button>
    </form>
  );
}
