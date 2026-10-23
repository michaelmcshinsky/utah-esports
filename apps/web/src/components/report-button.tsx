"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Dialog, Select, Textarea, Input } from "@utah-esports/ui";
import { reportFormSchema, type ReportFormValues } from "@/src/lib/forms/schemas";

export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "event" | "community" | "venue" | "organization";
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: { reason: "incorrect_info", details: "", contactEmail: "" },
    mode: "onBlur",
  });

  async function onSubmit(values: ReportFormValues) {
    setStatus("sending");
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        reason: values.reason,
        details: values.details?.trim() || null,
        contactEmail: values.contactEmail.trim() || null,
        targetType,
        targetId,
      }),
    });
    if (res.ok) {
      setStatus("sent");
      reset();
    } else {
      setStatus("error");
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Report incorrect info
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Report a problem"
        description="Reports go to moderators — thanks for keeping listings accurate."
      >
        {status === "sent" ? (
          <p className="text-sm text-success-700">
            Report received. A moderator will review it.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Select
              label="What's wrong?"
              error={errors.reason?.message}
              options={[
                { value: "incorrect_info", label: "Incorrect information" },
                { value: "event_cancelled", label: "Event is cancelled / didn't happen" },
                { value: "broken_link", label: "Broken registration or link" },
                { value: "unsafe", label: "Safety concern" },
                { value: "spam", label: "Spam" },
                { value: "other", label: "Something else" },
              ]}
              {...register("reason")}
            />
            <Textarea
              label="Details"
              rows={4}
              hint="What should we fix?"
              error={errors.details?.message}
              {...register("details")}
            />
            <Input
              label="Your email (optional)"
              type="email"
              hint="Only used if a moderator needs follow-up"
              error={errors.contactEmail?.message}
              {...register("contactEmail")}
            />
            {status === "error" ? (
              <p role="alert" className="text-sm text-danger-600">
                Couldn&apos;t send the report. Try again.
              </p>
            ) : null}
            <Button type="submit" disabled={isSubmitting || status === "sending"}>
              {status === "sending" ? "Sending…" : "Send report"}
            </Button>
          </form>
        )}
      </Dialog>
    </>
  );
}
