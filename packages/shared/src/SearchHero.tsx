"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@utah-esports/ui";

type Props = {
  /** Base path for the explore page (e.g. `/utah/explore`). */
  explorePath: string;
  className?: string;
  placeholderGame?: string;
  placeholderCity?: string;
};

/**
 * Standalone search bar: game + place → explore page.
 * Self-contained (no react-hook-form / zod) so it can live in the
 * shared package without pulling app-specific dependencies.
 */
export function SearchHero({ explorePath, className, placeholderGame = "Smash, Valorant, Rocket League…", placeholderCity = "Salt Lake City, Provo…" }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (city.trim()) params.set("city", city.trim());
    router.push(`${explorePath}${params.size ? `?${params}` : ""}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      aria-label="Find events"
      className={`grid gap-3 rounded-card border border-charcoal-700 bg-charcoal-800/80 p-4 backdrop-blur sm:grid-cols-[1.4fr_1fr_auto] ${className ?? ""}`}
    >
      <Input
        label="Game or activity"
        placeholder={placeholderGame}
        className="[&_label]:text-sandstone-100 [&_input]:border-charcoal-600 [&_input]:bg-charcoal-900 [&_input]:text-white [&_input]:placeholder:text-charcoal-400"
        value={q}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
      />
      <Input
        label="City"
        placeholder={placeholderCity}
        className="[&_label]:text-sandstone-100 [&_input]:border-charcoal-600 [&_input]:bg-charcoal-900 [&_input]:text-white [&_input]:placeholder:text-charcoal-400"
        value={city}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCity(e.target.value)}
      />
      <div className="flex items-end">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Find
        </Button>
      </div>
    </form>
  );
}
