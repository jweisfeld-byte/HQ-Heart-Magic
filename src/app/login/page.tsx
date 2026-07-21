"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/heart-in-cup.svg"
          alt=""
          className="mx-auto h-14 w-14"
        />
        <h1 className="mt-4 font-display text-2xl font-semibold text-foreground">
          Heart Magic HQ
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in with your Heart Magic Google Workspace account.
        </p>
        <button
          onClick={signInWithGoogle}
          className="mt-6 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        >
          Continue with Google
        </button>
      </div>
    </main>
  );
}
