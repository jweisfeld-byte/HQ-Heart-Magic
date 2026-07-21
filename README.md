# Heart Magic HQ

The internal operating system for Heart Magic — see `docs/` for the full
product requirements, technical architecture, design system, and knowledge
graph specs that this app is built from.

## Setup

See [`SETUP.md`](./SETUP.md) for connecting Supabase and Google sign-in.

## Stack

Next.js (App Router) · TypeScript · Tailwind v4 · Supabase (Auth + Postgres)

## Structure

- `docs/` — architecture and knowledge documentation (the source spec)
- `src/app/(app)/` — authenticated app shell: dashboard + the 8 nav modules
- `src/app/login`, `src/app/auth/callback` — Supabase Auth (Google OAuth)
- `src/lib/supabase/` — Supabase client/server/middleware helpers
