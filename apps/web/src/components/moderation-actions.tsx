"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@utah-esports/ui";

type Target = "submission" | "report" | "claim" | "duplicate";

export function ModerationActionButtons({
  targetType,
  id,
  actions,
}: {
  targetType: Target;
  id: string;
  actions: Array<{ action: string; label: string; variant?: "primary" | "outline" | "danger" }>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: string) {
    setBusy(action);
    setError(null);
    const res = await fetch("/api/moderation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetType, id, action }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Action failed");
    }
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {actions.map((a) => (
        <Button
          key={a.action}
          size="sm"
          variant={a.variant ?? (a.action.includes("reject") || a.action.includes("deny") || a.action.includes("dismiss") ? "outline" : "primary")}
          disabled={busy !== null}
          onClick={() => run(a.action)}
        >
          {busy === a.action ? "…" : a.label}
        </Button>
      ))}
      {error ? (
        <p role="alert" className="w-full text-xs text-danger-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
