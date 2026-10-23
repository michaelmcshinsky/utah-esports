"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  applyPreset,
  parseFilters,
  serializeFilters,
  QUICK_PRESETS,
  EVENT_TYPES,
  EVENT_FORMATS,
  SKILL_LEVELS,
  AGE_POLICIES,
} from "@utah-esports/core";
import { Button, Checkbox, Chip, Input, Select } from "@utah-esports/ui";
import {
  dateRangeFormSchema,
  type DateRangeFormValues,
} from "@/src/lib/forms/schemas";

const TYPE_LABELS: Record<string, string> = {
  tournament: "Tournament",
  casual: "Casual",
  watch_party: "Watch party",
  workshop: "Workshop",
  tryout: "Tryout",
  league: "League",
  other: "Other",
};

const FORMAT_LABELS: Record<string, string> = {
  in_person: "In person",
  online: "Online",
  hybrid: "Hybrid",
};

const SKILL_LABELS: Record<string, string> = {
  beginner_friendly: "Beginner-friendly",
  open: "Open",
  intermediate: "Intermediate",
  advanced: "Advanced",
  competitive: "Competitive",
  unknown: "Any skill",
};

const AGE_LABELS: Record<string, string> = {
  all_ages: "All ages",
  teen: "Teens",
  "18_plus": "18+",
  "21_plus": "21+",
  unknown: "Any age",
};

function toggleListValue(values: string[], value: string): string[] {
  return values.includes(value) ? values.filter((v) => v !== value) : [...values, value];
}

/** Expand yyyy-MM-dd to local day bounds as ISO (filter schema needs offsets). */
function dayStartIso(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString();
}
function dayEndIso(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString();
}

export type FilterBarProps = {
  gameOptions: Array<{ slug: string; name: string }>;
};

/**
 * One filter system for list + calendar + map. State lives in the URL so
 * results are shareable and back/forward preserve filters.
 */
export function FilterBar({ gameOptions }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const filter = parseFilters(searchParams);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DateRangeFormValues>({
    resolver: zodResolver(dateRangeFormSchema),
    defaultValues: {
      q: filter.q ?? "",
      city: filter.city ?? "",
      from: filter.from ? filter.from.slice(0, 10) : "",
      to: filter.to ? filter.to.slice(0, 10) : "",
    },
  });

  const apply = useCallback(
    (next: typeof filter) => {
      const query = serializeFilters(next);
      startTransition(() => {
        router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
      });
    },
    [router, pathname],
  );

  const onDateSearch = handleSubmit((values) => {
    apply({
      ...filter,
      q: values.q?.trim() || undefined,
      city: values.city?.trim() || undefined,
      from: values.from ? dayStartIso(values.from) : undefined,
      to: values.to ? dayEndIso(values.to) : undefined,
      page: 1,
    });
  });

  const activeCount =
    filter.games.length +
    filter.types.length +
    filter.formats.length +
    filter.skills.length +
    filter.ages.length +
    (filter.freeOnly ? 1 : 0) +
    (filter.beginnerOnly ? 1 : 0) +
    (filter.youthOnly ? 1 : 0);

  return (
    <section
      aria-label="Filters"
      className={`rounded-card border border-charcoal-200 bg-white p-4 transition-opacity ${isPending ? "opacity-60" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {QUICK_PRESETS.map((preset) => {
          const selected =
            (preset.id === "beginner" && filter.beginnerOnly) ||
            (preset.id === "free" && filter.freeOnly) ||
            (preset.id === "youth" && filter.youthOnly) ||
            (preset.id === "online" &&
              filter.formats.length === 1 &&
              filter.formats[0] === "online");
          return (
            <Chip
              key={preset.id}
              selected={selected}
              onClick={() => apply(applyPreset(preset.id, filter))}
            >
              {preset.label}
            </Chip>
          );
        })}
      </div>

      <form className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" onSubmit={onDateSearch} noValidate>
        <Input
          label="Search"
          type="search"
          placeholder="Event or game name"
          error={errors.q?.message}
          {...register("q")}
        />
        <Input
          label="City"
          type="search"
          placeholder="Salt Lake City, Provo…"
          error={errors.city?.message}
          {...register("city")}
        />
        <Input label="From" type="date" error={errors.from?.message} {...register("from")} />
        <Input label="To" type="date" error={errors.to?.message} {...register("to")} />
        <div className="sm:col-span-2 lg:col-span-4">
          <Button type="submit" size="sm">
            Apply dates & text
          </Button>
        </div>
      </form>

      <details className="mt-4 border-t border-charcoal-100 pt-4" open={activeCount > 0}>
        <summary className="inline-flex min-h-6 cursor-pointer items-center py-1 text-sm font-medium text-charcoal-700">
          More filters {activeCount > 0 ? `(${activeCount} active)` : ""}
        </summary>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-charcoal-800">Event type</legend>
            <div className="flex flex-col gap-2">
              {EVENT_TYPES.map((type) => (
                <Checkbox
                  key={type}
                  label={TYPE_LABELS[type] ?? type}
                  checked={filter.types.includes(type)}
                  onChange={() =>
                    apply({ ...filter, types: toggleListValue(filter.types, type), page: 1 })
                  }
                />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-charcoal-800">Format</legend>
            <div className="flex flex-col gap-2">
              {EVENT_FORMATS.map((format) => (
                <Checkbox
                  key={format}
                  label={FORMAT_LABELS[format] ?? format}
                  checked={filter.formats.includes(format)}
                  onChange={() =>
                    apply({
                      ...filter,
                      formats: toggleListValue(filter.formats, format),
                      page: 1,
                    })
                  }
                />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-charcoal-800">Skill & age</legend>
            <div className="flex flex-col gap-2">
              {SKILL_LEVELS.filter((s) => s !== "unknown").map((skill) => (
                <Checkbox
                  key={skill}
                  label={SKILL_LABELS[skill] ?? skill}
                  checked={filter.skills.includes(skill)}
                  onChange={() =>
                    apply({ ...filter, skills: toggleListValue(filter.skills, skill), page: 1 })
                  }
                />
              ))}
              {AGE_POLICIES.filter((a) => a !== "unknown").map((age) => (
                <Checkbox
                  key={age}
                  label={AGE_LABELS[age] ?? age}
                  checked={filter.ages.includes(age)}
                  onChange={() =>
                    apply({ ...filter, ages: toggleListValue(filter.ages, age), page: 1 })
                  }
                />
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-3">
            <Select
              label="Game"
              value={filter.games[0] ?? ""}
              onChange={(e) =>
                apply({ ...filter, games: e.target.value ? [e.target.value] : [], page: 1 })
              }
              options={[
                { value: "", label: "All games" },
                ...gameOptions.map((g) => ({ value: g.slug, label: g.name })),
              ]}
            />
            <Select
              label="Sort"
              value={filter.sort}
              onChange={(e) => apply({ ...filter, sort: e.target.value as typeof filter.sort })}
              options={[
                { value: "soonest", label: "Soonest first" },
                { value: "recently_added", label: "Newest listed" },
                { value: "distance", label: "Nearest (set city)" },
              ]}
            />
            {activeCount > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  apply({
                    ...filter,
                    games: [],
                    types: [],
                    formats: [],
                    skills: [],
                    ages: [],
                    freeOnly: false,
                    beginnerOnly: false,
                    youthOnly: false,
                    page: 1,
                  })
                }
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>
      </details>
    </section>
  );
}
