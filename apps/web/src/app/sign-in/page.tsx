"use client";

import { useState, type FormEvent } from "react";
import { Alert, Button, Input } from "@utah-esports/ui";
import { createSupabaseBrowserClient, supabaseConfigured } from "@/src/lib/supabase/browser";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!supabaseConfigured()) {
    return (
      <div className="page-container py-16">
        <div className="mx-auto max-w-md rounded-card border border-charcoal-200 bg-white p-8 text-center">
          <h1 className="text-xl font-semibold">Sign in unavailable</h1>
          <p className="mt-2 text-sm text-charcoal-600">
            Authentication isn&apos;t configured in this environment. Set the Supabase env vars
            (see .env.example) to enable accounts.
          </p>
        </div>
      </div>
    );
  }

  async function sendMagicLink(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function oauth(provider: "discord" | "google") {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="page-container py-16">
      <div className="mx-auto max-w-md rounded-card border border-charcoal-200 bg-white p-8">
        <h1 className="font-display text-2xl font-bold">Sign in</h1>
        <p className="mt-1 text-sm text-charcoal-600">
          Save events, follow communities, and get weekly digests. Browsing never requires an
          account.
        </p>

        {status === "sent" ? (
          <Alert variant="success" title="Check your email" className="mt-6">
            We sent a magic link to {email}. Click it to finish signing in.
          </Alert>
        ) : (
          <form onSubmit={sendMagicLink} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {status === "error" ? (
              <Alert variant="danger" title="Could not send link">
                {message}
              </Alert>
            ) : null}
            <Button type="submit" className="w-full" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send magic link"}
            </Button>
          </form>
        )}

        <div className="mt-6 border-t border-charcoal-100 pt-6">
          <p className="text-center text-sm text-charcoal-600">Or continue with</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => oauth("discord")}>
              Discord
            </Button>
            <Button variant="outline" onClick={() => oauth("google")}>
              Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
