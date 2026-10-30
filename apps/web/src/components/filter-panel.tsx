"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  applyPreset,
  serializeFilters,
  QUICK_PRESETS,
  EVENT_TYPES,
  EVENT_FORMATS,
  SKILL_LEVELS,
  AGE_POLICIES,
  type EventSearchFilter,
} from "@utah-esports/core";

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
};

const AGE_LABELS: Record<string, string> = {
  all_ages: "All ages",
  teen: "Teens",
  "18_plus": "18+",
  "21_plus": "21+",
};

function activeCount(f: EventSearchFilter): number {
  let n = 0;
  if (f.q) n += 1;
  if (f.city) n += 1;
  if (f.games.length) n += 1;
  if (f.types.length) n += 1;
  if (f.formats.length) n += 1;
  if (f.skills.length) n += 1;
  if (f.ages.length) n += 1;
  if (f.freeOnly) n += 1;
  if (f.beginnerOnly) n += 1;
  if (f.youthOnly) n += 1;
  if (f.radiusKm != null) n += 1;
  if (f.from) n += 1;
  if (f.to) n += 1;
  if (f.sort !== "soonest") n += 1;
  return n;
}

function countLive(form: HTMLFormElement): number {
  let n = 0;
  for (const el of Array.from(form.querySelectorAll("input, select"))) {
    if (el instanceof HTMLInputElement) {
      if (el.type === "checkbox") {
        if (el.checked !== el.defaultChecked) n += 1;
      } else if (el.value !== el.defaultValue) {
        n += 1;
      }
    } else if (el instanceof HTMLSelectElement && el.selectedIndex !== 0) {
      n += 1;
    }
  }
  return n;
}

function checkboxGroup(
  name: string,
  selected: string[],
  options: Array<{ value: string; label: string }>,
) {
  return options.map((opt) => (
    <label key={opt.value} className="flex items-center gap-2 text-sm text-charcoal-700">
      <input
        type="checkbox"
        name={name}
        value={opt.value}
        defaultChecked={selected.includes(opt.value)}
        className="size-4 rounded border-charcoal-300 text-redrock-500 focus:ring-redrock-500"
      />
      {opt.label}
    </label>
  ));
}

type Props = {
  filter: EventSearchFilter;
  gameOptions: Array<{ slug: string; name: string }>;
};

/**
 * Search bar + filter popover (ballroom-hub pattern).
 * State lives in the URL; the form submits via GET so hidden <details>
 * content still round-trips. The badge shows applied + live-edits.
 */
export function FilterPanel({ filter, gameOptions }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const applied = activeCount(filter);
  const [liveEdits, setLiveEdits] = useState(0);
  const badgeCount = applied + liveEdits;

  const cancel = () => {
    formRef.current?.reset();
    setLiveEdits(0);
    if (detailsRef.current) detailsRef.current.open = false;
  };

  const reset = () => {
    const form = formRef.current;
    if (form) {
      for (const el of Array.from(form.querySelectorAll("input, select"))) {
        if (el instanceof HTMLInputElement) {
          if (el.type === "checkbox") el.checked = false;
          else el.value = "";
        } else if (el instanceof HTMLSelectElement) {
          el.selectedIndex = 0;
        }
      }
      setLiveEdits(0);
    }
    router.replace(window.location.pathname);
    if (detailsRef.current) detailsRef.current.open = false;
  };

  return (
    <form
      ref={formRef}
      method="get"
      className="space-y-3"
      onChange={() => {
        if (formRef.current) setLiveEdits(countLive(formRef.current));
      }}
    >
      {/* Quick preset chips */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PRESETS.map((preset) => {
          const selected =
            (preset.id === "beginner" && filter.beginnerOnly) ||
            (preset.id === "free" && filter.freeOnly) ||
            (preset.id === "youth" && filter.youthOnly) ||
            (preset.id === "online" &&
              filter.formats.length === 1 &&
              filter.formats[0] === "online");
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                const next = applyPreset(preset.id, filter);
                const query = serializeFilters(next);
                router.replace(`${window.location.pathname}${query ? `?${query}` : ""}`, { scroll: false });
              }}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? "bg-redrock-500 text-white"
                  : "border border-charcoal-300 bg-white text-charcoal-700 hover:border-redrock-300 hover:text-redrock-600"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Search row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="filter-q" className="block text-sm font-medium text-charcoal-700">
            Search events
          </label>
          <input
            id="filter-q"
            name="q"
            type="search"
            defaultValue={filter.q ?? ""}
            placeholder="Game, event name…"
            className="mt-1 w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:border-redrock-500 focus:outline-none focus:ring-1 focus:ring-redrock-500"
          />
        </div>

        <details ref={detailsRef} className="relative" open={applied > 0}>
          <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-lg border border-charcoal-300 bg-white px-4 py-2 text-sm font-medium text-charcoal-700 hover:border-charcoal-400 [&::-webkit-details-marker]:hidden">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" className="size-4" aria-hidden>
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            Filters
            {badgeCount > 0 ? (
              <span className="rounded-full bg-redrock-500 px-2 py-0.5 text-xs font-bold text-white">
                {badgeCount}
              </span>
            ) : null}
          </summary>

          <div className="absolute left-0 top-full z-50 mt-2 w-[min(680px,calc(100vw-2rem))] rounded-xl border border-charcoal-200 bg-white p-4 shadow-card-hover sm:p-5">
            {/* Selects row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="filter-game" className="block text-sm font-medium text-charcoal-700">
                  Game
                </label>
                <select
                  id="filter-game"
                  name="games"
                  defaultValue={filter.games[0] ?? ""}
                  className="mt-1 w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2 text-sm focus:border-redrock-500 focus:outline-none focus:ring-1 focus:ring-redrock-500"
                >
                  <option value="">All games</option>
                  {gameOptions.map((g) => (
                    <option key={g.slug} value={g.slug}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filter-city" className="block text-sm font-medium text-charcoal-700">
                  City
                </label>
                <input
                  id="filter-city"
                  name="city"
                  type="text"
                  defaultValue={filter.city ?? ""}
                  placeholder="Salt Lake City…"
                  className="mt-1 w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2 text-sm focus:border-redrock-500 focus:outline-none focus:ring-1 focus:ring-redrock-500"
                />
              </div>
              <div>
                <label htmlFor="filter-from" className="block text-sm font-medium text-charcoal-700">
                  From date
                </label>
                <input
                  id="filter-from"
                  name="from"
                  type="date"
                  defaultValue={filter.from ? filter.from.slice(0, 10) : ""}
                  className="mt-1 w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2 text-sm focus:border-redrock-500 focus:outline-none focus:ring-1 focus:ring-redrock-500"
                />
              </div>
              <div>
                <label htmlFor="filter-to" className="block text-sm font-medium text-charcoal-700">
                  To date
                </label>
                <input
                  id="filter-to"
                  name="to"
                  type="date"
                  defaultValue={filter.to ? filter.to.slice(0, 10) : ""}
                  className="mt-1 w-full rounded-lg border border-charcoal-300 bg-white px-3 py-2 text-sm focus:border-redrock-500 focus:outline-none focus:ring-1 focus:ring-redrock-500"
                />
              </div>
            </div>

            {/* Checkbox groups */}
            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-charcoal-700">Event type</legend>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                {checkboxGroup("types", filter.types, EVENT_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] ?? t })))}
              </div>
            </fieldset>

            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-charcoal-700">Format</legend>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {checkboxGroup("formats", filter.formats, EVENT_FORMATS.map((f) => ({ value: f, label: FORMAT_LABELS[f] ?? f })))}
              </div>
            </fieldset>

            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-charcoal-700">Skill level</legend>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {checkboxGroup("skills", filter.skills, SKILL_LEVELS.filter((s) => s !== "unknown").map((s) => ({ value: s, label: SKILL_LABELS[s] ?? s })))}
              </div>
            </fieldset>

            <fieldset className="mt-4">
              <legend className="text-sm font-medium text-charcoal-700">Age</legend>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {checkboxGroup("ages", filter.ages, AGE_POLICIES.filter((a) => a !== "unknown").map((a) => ({ value: a, label: AGE_LABELS[a] ?? a })))}
              </div>
            </fieldset>

            {/* Bottom row */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-charcoal-200 pt-4">
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-charcoal-700">
                  <input type="checkbox" name="freeOnly" value="true" defaultChecked={filter.freeOnly} className="size-4 rounded border-charcoal-300 text-redrock-500" />
                  Free only
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-charcoal-700">
                  <input type="checkbox" name="beginnerOnly" value="true" defaultChecked={filter.beginnerOnly} className="size-4 rounded border-charcoal-300 text-redrock-500" />
                  Beginner-friendly
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-charcoal-700">
                  <input type="checkbox" name="youthOnly" value="true" defaultChecked={filter.youthOnly} className="size-4 rounded border-charcoal-300 text-redrock-500" />
                  Youth programs
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="submit" className="rounded-lg bg-redrock-500 px-4 py-2 text-sm font-medium text-white hover:bg-redrock-600">
                  Apply
                </button>
                <button type="button" onClick={reset} className="rounded-lg px-4 py-2 text-sm font-medium text-charcoal-600 hover:bg-charcoal-100">
                  Reset
                </button>
                <button type="button" onClick={cancel} className="rounded-lg px-4 py-2 text-sm font-medium text-charcoal-600 hover:bg-charcoal-100">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </details>

        <button type="submit" className="rounded-lg bg-redrock-500 px-5 py-2 text-sm font-medium text-white hover:bg-redrock-600">
          Search
        </button>
      </div>

      {/* Hidden fields to preserve sort/view when submitting */}
      <input type="hidden" name="sort" value={filter.sort} />
    </form>
  );
}
