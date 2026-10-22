"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@utah-esports/ui";

export type FollowKind = "event" | "game" | "community" | "organization" | "venue";

export function FollowButton({
  kind,
  targetId,
  size = "sm",
}: {
  kind: FollowKind;
  targetId: string;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);

  const query = `kind=${kind}&targetId=${targetId}`;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/follow?${query}`)
      .then((r) => (r.ok ? r.json() : { following: false }))
      .then((data) => {
        if (!cancelled) {
          setFollowing(Boolean(data.following));
          setChecked(true);
        }
      })
      .catch(() => setChecked(true));
    return () => {
      cancelled = true;
    };
  }, [query]);

  async function toggle() {
    setBusy(true);
    const res = await fetch(`/api/follow?${query}`, {
      method: following ? "DELETE" : "POST",
    });
    if (res.status === 401) {
      router.push("/sign-in");
      return;
    }
    if (res.ok) setFollowing(!following);
    setBusy(false);
  }

  if (!checked) {
    return (
      <Button variant="outline" size={size} disabled>
        Follow
      </Button>
    );
  }

  return (
    <Button variant={following ? "secondary" : "outline"} size={size} onClick={toggle} disabled={busy}>
      {following ? "Following ✓" : "Follow for updates"}
    </Button>
  );
}
