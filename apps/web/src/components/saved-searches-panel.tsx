"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@utah-esports/ui";

type SavedSearch = {
  id: string;
  name: string;
  query: string;
  notify: boolean;
};

export function SavedSearchesPanel({ searches }: { searches: SavedSearch[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const currentQuery =
    typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "";

  async function saveCurrent() {
    if (!name.trim()) return;
    setBusy(true);
    const query = new URLSearchParams(window.location.search);
    query.delete("page");
    await fetch("/api/saved-searches", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim(), query: query.toString(), notify: true }),
    });
    setName("");
    setBusy(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved searches</CardTitle>
      </CardHeader>
      <CardContent>
        {searches.length === 0 ? (
          <p className="text-sm text-charcoal-600">
            Save a filter combination from Explore to get notified when new events match.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {searches.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2">
                <a href={`/explore?${s.query}`} className="text-redrock-600 hover:underline">
                  {s.name}
                </a>
                <span className="text-xs text-charcoal-500">{s.notify ? "notifying" : "paused"}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex gap-2">
          <Input
            label="Save current search"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weekend Smash near Provo"
            className="flex-1"
          />
          <div className="flex items-end">
            <Button size="sm" onClick={saveCurrent} disabled={busy || !name.trim()}>
              Save
            </Button>
          </div>
        </div>
        {currentQuery ? (
          <p className="mt-2 text-xs text-charcoal-500">Based on: /explore?{currentQuery}</p>
        ) : (
          <p className="mt-2 text-xs text-charcoal-500">
            Tip: open Explore, apply filters, then come back here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
