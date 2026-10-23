"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, Textarea } from "@utah-esports/ui";
import {
  createOrganizationFormSchema,
  type CreateOrganizationFormValues,
} from "@/src/lib/forms/schemas";

export function CreateOrganizationForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(createOrganizationFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      kind: "community",
      contactEmail: "",
      city: "",
      websiteUrl: "",
      description: "",
    },
  });

  async function onSubmit(values: CreateOrganizationFormValues) {
    const res = await fetch("/api/organizations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        slug: values.slug,
        kind: values.kind,
        contactEmail: values.contactEmail,
        city: values.city?.trim() || null,
        websiteUrl: values.websiteUrl || null,
        description: values.description?.trim() || null,
      }),
    });
    if (res.ok) {
      router.refresh();
      return;
    }
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    setError("root", { message: body?.error ?? "Could not create organization" });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an organization</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <Input label="Name" error={errors.name?.message} {...register("name")} />
          <Input label="Slug" hint="lowercase-with-dashes" error={errors.slug?.message} {...register("slug")} />
          <Select
            label="Kind"
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
            error={errors.kind?.message}
            {...register("kind")}
          />
          <Input label="Contact email" type="email" error={errors.contactEmail?.message} {...register("contactEmail")} />
          <Input label="City" error={errors.city?.message} {...register("city")} />
          <Input label="Website" type="url" error={errors.websiteUrl?.message} {...register("websiteUrl")} />
          <Textarea label="Description" rows={3} error={errors.description?.message} {...register("description")} />
          {errors.root?.message ? (
            <p role="alert" className="text-sm text-danger-600">
              {errors.root.message}
            </p>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating…" : "Create"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
