import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client. NEVER import this from client components —
// it bypasses Row Level Security and must only run on the server (route
// handlers, server components, server actions).
//
// Requires SUPABASE_SERVICE_ROLE_KEY, which is intentionally separate from
// the public anon key used elsewhere in this app.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
