"use client";

import { useRouter } from "next/navigation";
import { Button } from "@utah-esports/ui";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
