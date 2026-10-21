"use client";

import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@utah-esports/ui";

export function ClaimForm({ organizationId }: { organizationId: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);
    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationId,
        proofUrl: data.get("proofUrl"),
        contactEmail: data.get("contactEmail"),
        message: data.get("message") || null,
      }),
    });
    setStatus(res.ok ? "sent" : "error");
    if (res.ok) form.reset();
  }

  return (
    <Card className="mt-6 max-w-xl">
      <CardHeader>
        <CardTitle>Claim request</CardTitle>
      </CardHeader>
      <CardContent>
        {status === "sent" ? (
          <p className="text-sm text-success-700">
            Claim submitted. A moderator will review your proof link.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Proof URL"
              name="proofUrl"
              type="url"
              required
              hint="Public page linking your name/email to this organization"
            />
            <Input label="Contact email" name="contactEmail" type="email" required />
            <Textarea label="Message" name="message" rows={3} />
            {status === "error" ? (
              <p role="alert" className="text-sm text-danger-600">
                Submission failed. Try again.
              </p>
            ) : null}
            <Button type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Submitting…" : "Submit claim"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
