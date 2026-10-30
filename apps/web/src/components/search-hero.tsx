"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@utah-esports/ui";
import {
  searchHeroFormSchema,
  type SearchHeroFormValues,
} from "@/src/lib/forms/schemas";

/**
 * Homepage discovery bar: game + place → /events.
 * Events owns real filtering; this just seeds its URL state.
 */
export function SearchHero({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchHeroFormValues>({
    resolver: zodResolver(searchHeroFormSchema),
    defaultValues: {
      q: searchParams.get("q") ?? "",
      city: searchParams.get("city") ?? "",
    },
  });

  function onSubmit(values: SearchHeroFormValues) {
    const params = new URLSearchParams();
    if (values.q?.trim()) params.set("q", values.q.trim());
    if (values.city?.trim()) params.set("city", values.city.trim());
    router.push(`/events${params.size ? `?${params}` : ""}`);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      role="search"
      aria-label="Find events"
      className={`grid gap-3 rounded-card border border-charcoal-700 bg-charcoal-800/80 p-4 backdrop-blur sm:grid-cols-[1.4fr_1fr_auto] ${className ?? ""}`}
    >
      <Input
        label="Game or activity"
        error={errors.q?.message}
        placeholder="Smash, Valorant, Rocket League…"
        className="[&_label]:text-sandstone-100 [&_input]:border-charcoal-600 [&_input]:bg-charcoal-900 [&_input]:text-white [&_input]:placeholder:text-charcoal-400"
        {...register("q")}
      />
      <Input
        label="City"
        error={errors.city?.message}
        placeholder="Provo, Salt Lake City…"
        className="[&_label]:text-sandstone-100 [&_input]:border-charcoal-600 [&_input]:bg-charcoal-900 [&_input]:text-white [&_input]:placeholder:text-charcoal-400"
        {...register("city")}
      />
      <div className="flex items-end">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Find
        </Button>
      </div>
    </form>
  );
}
