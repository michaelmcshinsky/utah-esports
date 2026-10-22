"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@utah-esports/ui";

export function SaveEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/saves/${eventId}`)
      .then((r) => (r.ok ? r.json() : { saved: false }))
      .then((data) => {
        if (!cancelled) {
          setSaved(Boolean(data.saved));
          setChecked(true);
        }
      })
      .catch(() => setChecked(true));
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function toggle() {
    setBusy(true);
    const res = await fetch(`/api/saves/${eventId}`, {
      method: saved ? "DELETE" : "POST",
    });
    if (res.status === 401) {
      router.push("/sign-in");
      return;
    }
    if (res.ok) setSaved(!saved);
    setBusy(false);
  }

  if (!checked) {
    return (
      <Button variant="outline" size="sm" disabled>
        Save
      </Button>
    );
  }

  return (
    <Button variant={saved ? "secondary" : "outline"} size="sm" onClick={toggle} disabled={busy}>
      {saved ? "Saved ✓" : "Save event"}
    </Button>
  );
}
