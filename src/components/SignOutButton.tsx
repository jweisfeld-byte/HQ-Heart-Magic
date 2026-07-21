"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className="rounded-md px-2 py-1 font-medium text-foreground/70 transition hover:text-accent"
    >
      Sign out
    </button>
  );
}
