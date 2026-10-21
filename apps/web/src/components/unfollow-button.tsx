"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FollowKind } from "./follow-button";

export function UnfollowButton({ kind, targetId }: { kind: FollowKind; targetId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function unfollow() {
    setBusy(true);
    await fetch(`/api/follow?kind=${kind}&targetId=${targetId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={unfollow}
      disabled={busy}
      className="text-xs font-medium text-charcoal-500 underline hover:text-danger-600 disabled:opacity-50"
    >
      {busy ? "Removing…" : "Unfollow"}
    </button>
  );
}
