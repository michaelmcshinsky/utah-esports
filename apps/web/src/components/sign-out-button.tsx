"use client";

import { Button } from "@utah-esports/ui";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/browser";

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        window.location.href = "/";
      }}
    >
      Sign out
    </Button>
  );
}
