"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Input } from "@utah-esports/ui";

/**
 * Homepage discovery bar: game + place + when → /explore.
 * The explore page owns real filtering; this just seeds its URL state.
 */
export function SearchHero({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [game, setGame] = useState(searchParams.get("q") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (game.trim()) params.set("q", game.trim());
    if (city.trim()) params.set("city", city.trim());
    router.push(`/explore${params.size ? `?${params}` : ""}`);
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
        name="q"
        value={game}
        onChange={(e) => setGame(e.target.value)}
        placeholder="Smash, Valorant, Rocket League…"
        className="[&_label]:text-sandstone-100 [&_input]:border-charcoal-600 [&_input]:bg-charcoal-900 [&_input]:text-white [&_input]:placeholder:text-charcoal-400"
      />
      <Input
        label="City"
        name="city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Provo, Salt Lake City…"
        className="[&_label]:text-sandstone-100 [&_input]:border-charcoal-600 [&_input]:bg-charcoal-900 [&_input]:text-white [&_input]:placeholder:text-charcoal-400"
      />
      <div className="flex items-end">
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          Find
        </Button>
      </div>
    </form>
  );
}
