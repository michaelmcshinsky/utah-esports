"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@utah-esports/ui";

export function DiscordLinkPanel() {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/discord/link", { method: "POST" });
    if (res.status === 401) {
      router.push("/sign-in");
      return;
    }
    if (res.ok) {
      const body = await res.json();
      setCode(body.code);
    } else {
      setError("Could not generate a code — try again.");
    }
    setBusy(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discord</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-charcoal-600">
          Link your Discord account to get team roles and use <code>/events</code> and{" "}
          <code>/roster</code> in servers with our bot.
        </p>
        {code ? (
          <div className="mt-3 rounded-lg border border-charcoal-200 bg-sandstone-100 p-3">
            <p className="text-xs text-charcoal-500">In Discord, run:</p>
            <p className="mt-1 font-mono text-sm font-semibold text-charcoal-900">
              /link code:{code}
            </p>
            <p className="mt-1 text-xs text-charcoal-500">Expires in 15 minutes.</p>
          </div>
        ) : (
          <Button className="mt-3" size="sm" onClick={generate} disabled={busy}>
            {busy ? "Generating…" : "Generate link code"}
          </Button>
        )}
        {error ? (
          <p role="alert" className="mt-2 text-sm text-danger-600">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
