"use client";

import { useState, type FormEvent } from "react";
import { Button, Dialog, Select, Textarea, Input } from "@utah-esports/ui";

export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "event" | "community" | "venue" | "organization";
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus("sending");
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        targetType,
        targetId,
        reason: data.get("reason"),
        details: data.get("details") || null,
        contactEmail: data.get("contactEmail") || null,
      }),
    });
    if (res.ok) {
      setStatus("sent");
      form.reset();
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
          <form onSubmit={onSubmit} className="space-y-4">
            <Select
              label="What's wrong?"
              name="reason"
              required
              options={[
                { value: "incorrect_info", label: "Incorrect information" },
                { value: "event_cancelled", label: "Event is cancelled / didn't happen" },
                { value: "broken_link", label: "Broken registration or link" },
                { value: "unsafe", label: "Safety concern" },
                { value: "spam", label: "Spam" },
                { value: "other", label: "Something else" },
              ]}
            />
            <Textarea label="Details" name="details" rows={4} hint="What should we fix?" />
            <Input
              label="Your email (optional)"
              name="contactEmail"
              type="email"
              hint="Only used if a moderator needs follow-up"
            />
            {status === "error" ? (
              <p role="alert" className="text-sm text-danger-600">
                Couldn&apos;t send the report. Try again.
              </p>
            ) : null}
            <Button type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send report"}
            </Button>
          </form>
        )}
      </Dialog>
    </>
  );
}
