"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@utah-esports/ui";

export function ConfirmEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/events/${eventId}/confirm`, { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Confirm failed");
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <Button size="sm" onClick={confirm} disabled={busy}>
        {busy ? "Confirming…" : "Confirm details are current"}
      </Button>
      {error ? (
        <span role="alert" className="text-xs text-danger-600">
          {error}
        </span>
      ) : null}
    </span>
  );
}
