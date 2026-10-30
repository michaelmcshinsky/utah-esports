"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Input } from "@utah-esports/ui";
import { createSupabaseBrowserClient, supabaseConfigured } from "@/src/lib/supabase/browser";
import { signInFormSchema, type SignInFormValues } from "@/src/lib/forms/schemas";

function AccountBenefits() {
  return (
    <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-charcoal-600">
      <li>Save events and build a personal “this weekend” list</li>
      <li>Follow games, communities, venues, and orgs for change alerts</li>
      <li>Save searches and get emailed when new events match</li>
      <li>Weekly digest of what&apos;s coming up, on your schedule</li>
      <li>Link Discord for team roles and in-server commands</li>
    </ul>
  );
}

export default function SignInPage() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: { email: "" },
  });
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (!supabaseConfigured()) {
    return (
      <div className="page-container py-16">
        <div className="mx-auto max-w-md rounded-card border border-charcoal-200 bg-white p-8">
          <h1 className="text-center text-xl font-semibold">Sign in</h1>
          <p className="mt-1 text-center text-sm text-charcoal-600">
            Accounts unlock saves, follows, and notifications — browsing never requires one.
          </p>
          <AccountBenefits />
          <div className="mt-5 rounded-lg border border-dashed border-charcoal-300 bg-sandstone-50 p-4 text-center">
            <p className="text-sm font-medium text-charcoal-800">Sign-in is not configured here</p>
            <p className="mt-1 text-xs text-charcoal-600">
              Set the Supabase env vars (see .env.example) to enable accounts in this
              environment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  async function sendMagicLink(values: SignInFormValues) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: values.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError("email", { message: error.message });
    } else {
      setSentTo(values.email);
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
          Browsing never requires an account — but signing in is how you save what looks good and
          hear about it when things change.
        </p>
        <AccountBenefits />

        {sentTo ? (
          <Alert variant="success" title="Check your email" className="mt-6">
            We sent a magic link to {sentTo}. Click it to finish signing in.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(sendMagicLink)} className="mt-6 space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send magic link"}
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
