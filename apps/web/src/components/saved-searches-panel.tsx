"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@utah-esports/ui";
import {
  savedSearchFormSchema,
  type SavedSearchFormValues,
} from "@/src/lib/forms/schemas";

type SavedSearch = {
  id: string;
  name: string;
  query: string;
  notify: boolean;
};

export function SavedSearchesPanel({ searches }: { searches: SavedSearch[] }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SavedSearchFormValues>({
    resolver: zodResolver(savedSearchFormSchema),
    defaultValues: { name: "" },
  });

  const currentQuery =
    typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";

  async function saveCurrent(values: SavedSearchFormValues) {
    if (!currentQuery) {
      setError("name", {
        message: "Open Events and apply filters first, then come back to save.",
      });
      return;
    }
    // Strip pagination from the snapshot — saved searches are filter sets.
    const params = new URLSearchParams(currentQuery);
    params.delete("page");
    const query = params.toString();
    if (!query) {
      setError("name", {
        message: "Open Events and apply filters first, then come back to save.",
      });
      return;
    }
    const res = await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        query,
        notify: true,
      }),
    });
    if (res.ok) {
      reset();
      router.refresh();
    } else {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setError("name", { message: body?.error ?? "Could not save — try again." });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved searches</CardTitle>
      </CardHeader>
      <CardContent>
        {searches.length === 0 ? (
          <p className="text-sm text-charcoal-600">
            Save a filter combination from Events to get notified when new events match.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {searches.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2">
                <a href={`/events?${s.query}`} className="text-redrock-600 hover:underline">
                  {s.name}
                </a>
                <span className="text-xs text-charcoal-500">
                  {s.notify ? "notifying" : "paused"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <form
          onSubmit={handleSubmit(saveCurrent)}
          className="mt-4 flex gap-2"
          noValidate
        >
          <div className="flex-1">
            <Input
              label="Save current search"
              error={errors.name?.message}
              {...register("name")}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
        {currentQuery ? (
          <p className="mt-2 text-xs text-charcoal-500">Based on: /events?{currentQuery}</p>
        ) : (
          <p className="mt-2 text-xs text-charcoal-500">
            Tip: open Events, apply filters, then come back here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
