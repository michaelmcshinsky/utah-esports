"use client";

import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Checkbox, Input, Select } from "@utah-esports/ui";
import { savePreferences } from "./actions";

type GameOption = { id: string; slug: string; name: string };

export type PreferencesDefaults = {
  displayName: string | null;
  city: string | null;
  radiusKm: number;
  digestDayOfWeek: number;
  digestEnabled: boolean;
  reminderEnabled: boolean;
  changeNotificationsEnabled: boolean;
  gameSlugs: string[];
};

type FormValues = PreferencesDefaults & Record<`game:${string}`, boolean>;

export function PreferencesForm({
  defaults,
  games,
}: {
  defaults: PreferencesDefaults;
  games: GameOption[];
}) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      ...defaults,
      ...Object.fromEntries(games.map((g) => [`game:${g.slug}`, defaults.gameSlugs.includes(g.slug)])),
    },
    mode: "onBlur",
  });

  const onSubmit = handleSubmit((values) => {
    const fd = new FormData();
    fd.set("displayName", values.displayName ?? "");
    fd.set("city", values.city ?? "");
    fd.set("radiusKm", String(values.radiusKm));
    fd.set("digestDayOfWeek", String(values.digestDayOfWeek));
    if (values.digestEnabled) fd.set("digestEnabled", "on");
    if (values.reminderEnabled) fd.set("reminderEnabled", "on");
    if (values.changeNotificationsEnabled) fd.set("changeNotificationsEnabled", "on");
    for (const game of games) {
      if (values[`game:${game.slug}`]) fd.set(`game:${game.slug}`, "on");
    }
    startTransition(() => {
      savePreferences(fd);
      setSaved(true);
    });
  });

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-xl space-y-4" noValidate>
      <Input label="Display name" error={errors.displayName?.message} {...register("displayName")} />
      <Input
        label="Home city"
        hint="Used for nearby defaults"
        error={errors.city?.message}
        {...register("city")}
      />
      <Input
        label="Search radius (km)"
        type="number"
        error={errors.radiusKm?.message}
        {...register("radiusKm", {
          valueAsNumber: true,
          min: { value: 1, message: "At least 1 km" },
          max: { value: 400, message: "400 km max" },
        })}
      />
      <Select
        label="Weekly digest day"
        options={[
          { value: "0", label: "Sunday" },
          { value: "1", label: "Monday" },
          { value: "2", label: "Tuesday" },
          { value: "3", label: "Wednesday" },
          { value: "4", label: "Thursday" },
          { value: "5", label: "Friday" },
          { value: "6", label: "Saturday" },
        ]}
        error={errors.digestDayOfWeek?.message}
        {...register("digestDayOfWeek", { valueAsNumber: true })}
      />
      <Checkbox label="Weekly digest email" {...register("digestEnabled")} />
      <Checkbox label="Registration deadline reminders" {...register("reminderEnabled")} />
      <Checkbox
        label="Notify me when saved events change"
        {...register("changeNotificationsEnabled")}
      />
      {games.length > 0 ? (
        <fieldset className="rounded-card border border-charcoal-200 bg-white p-4">
          <legend className="px-1 text-sm font-medium text-charcoal-800">Games I follow</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {games.slice(0, 16).map((game) => (
              <Checkbox key={game.id} label={game.name} {...register(`game:${game.slug}`)} />
            ))}
          </div>
        </fieldset>
      ) : null}
      {errors.root?.message ? (
        <p role="alert" className="text-sm text-danger-600">
          {errors.root.message}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save preferences"}
        </Button>
        {saved ? (
          <span className="text-sm text-success-700" role="status">
            Saved ✓
          </span>
        ) : null}
      </div>
    </form>
  );
}
