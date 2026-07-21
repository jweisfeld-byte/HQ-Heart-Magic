import { createBrowserClient } from "@supabase/ssr";

// Client-side Supabase client. NEXT_PUBLIC_* vars are safe to expose to the
// browser: the anon key is meant to be public and is constrained by Row
// Level Security policies on the database, not kept secret.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
