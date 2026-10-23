"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from "@utah-esports/ui";
import { claimFormSchema, type ClaimFormValues } from "@/src/lib/forms/schemas";

export function ClaimForm({ organizationId }: { organizationId: string }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: { proofUrl: "", contactEmail: "", message: "" },
  });
  const [sent, setSent] = useState(false);

  async function onSubmit(values: ClaimFormValues) {
    const res = await fetch("/api/claims", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        organizationId,
        proofUrl: values.proofUrl,
        contactEmail: values.contactEmail,
        message: values.message?.trim() || null,
      }),
    });
    if (res.ok) {
      setSent(true);
      return;
    }
    setError("root", { message: "Submission failed. Try again." });
  }

  return (
    <Card className="mt-6 max-w-xl">
      <CardHeader>
        <CardTitle>Claim request</CardTitle>
      </CardHeader>
      <CardContent>
        {sent ? (
          <p className="text-sm text-success-700">
            Claim submitted. A moderator will review your proof link.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Proof URL"
              type="url"
              hint="Public page linking your name/email to this organization"
              error={errors.proofUrl?.message}
              {...register("proofUrl")}
            />
            <Input label="Contact email" type="email" error={errors.contactEmail?.message} {...register("contactEmail")} />
            <Textarea label="Message" rows={3} error={errors.message?.message} {...register("message")} />
            {errors.root?.message ? (
              <p role="alert" className="text-sm text-danger-600">
                {errors.root.message}
              </p>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit claim"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
