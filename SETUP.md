# Heart Magic HQ — Setup

This app is scaffolded (Next.js 16, App Router, TypeScript, Tailwind v4) with
Supabase Auth wired in, but needs two things from you before sign-in works.

## 1. Create a Supabase project

1. Go to supabase.com, create a new project (or use an existing one you've
   already created for this app).
2. In the project dashboard, go to **Project Settings > API**.
3. Copy the **Project URL** and the **anon public** key.
4. Create a file named `.env.local` in this project's root (it's already in
   `.gitignore`, so it never gets committed) with:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

5. Add the same two variables in Vercel: Project Settings > Environment
   Variables, for the Production environment, then redeploy.

## 2. Enable Google sign-in

1. In the Supabase dashboard: **Authentication > Providers > Google**, toggle
   it on.
2. You'll need a Google OAuth Client ID + Secret from the Google Cloud
   Console (APIs & Services > Credentials > Create OAuth client ID, type
   "Web application"). Add Supabase's callback URL (shown on that same
   Providers page) as an authorized redirect URI.
3. Paste the Client ID + Secret into the Supabase Google provider settings
   and save.

## 3. Run it locally

```bash
npm install
npm run dev
```

Once `.env.local` is filled in, visiting `/login` will show a real "Continue
with Google" button that signs in through your Supabase project.

## What's built

- Auth: Supabase Auth (Google OAuth), session-protected routes via
  middleware — anything under the authenticated layout redirects to
  `/login` if you're signed out.
- Nav: the confirmed 8-item sidebar (Dashboard, Knowledge, Marketing,
  Creative, Creators, Analytics, Experiments, Settings).
- Dashboard: the Today View shell, with each briefing line honestly marked
  "Not connected yet" until its real data source (Shopify sync, Klaviyo
  sync, etc. — see `docs/Heart_Magic_OS_Product_Backlog_v1.md`) is wired in.
- Theme: the real Heart Magic brand pack (Deep Red, Warm Gold, Warm Cream,
  Alice/Poppins/Josefin Sans) — not the invented Sprint 1 palette. This
  resolves Backlog decision D2.
- The other six modules (Knowledge, Marketing, Creative, Creators,
  Analytics, Experiments) are stub pages, ready to become real
  Library-backed views per the Content Modules / Knowledge Graph docs.

## What's not built yet

- No database schema (Prisma/Postgres models) — nothing persists yet.
- No real data anywhere; every number you'd expect is a labeled placeholder.
- No seed pipeline from `docs/` into the database (needs the schema first).
