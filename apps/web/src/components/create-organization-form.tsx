"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from "@utah-esports/ui";

export function CreateOrganizationForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        slug: data.get("slug"),
        kind: data.get("kind"),
        contactEmail: data.get("contactEmail"),
        city: data.get("city") || null,
        websiteUrl: data.get("websiteUrl") || null,
        description: data.get("description") || null,
      }),
    });
    if (res.ok) {
      form.reset();
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not create organization");
    }
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an organization</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input label="Name" name="name" required />
          <Input label="Slug" name="slug" required hint="lowercase-with-dashes" />
          <Select
            label="Kind"
            name="kind"
            options={[
              { value: "community", label: "Community" },
              { value: "organizer", label: "Event organizer" },
              { value: "venue", label: "Venue" },
              { value: "team", label: "Team" },
              { value: "school", label: "School program" },
              { value: "collegiate", label: "Collegiate program" },
              { value: "youth", label: "Youth program" },
              { value: "other", label: "Other" },
            ]}
          />
          <Input label="Contact email" name="contactEmail" type="email" required />
          <Input label="City" name="city" />
          <Input label="Website" name="websiteUrl" type="url" />
          {error ? (
            <p role="alert" className="text-sm text-danger-600">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
