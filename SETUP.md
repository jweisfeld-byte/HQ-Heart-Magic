# Heart Magic HQ — Setup

This app is scaffolded (Next.js 16, App Router, TypeScript, Tailwind v4) with
Supabase Auth wired in, but needs a few things from you before sign-in and
the live Shopify data work.

## 1. Create a Supabase project

1. Go to supabase.com, create a new project (or use an existing one you've
   already created for this app).
2. In the project dashboard, go to **Project Settings > API**.
3. Copy the **Project URL**, the **anon public** key, and the
   **service_role** key (keep this one secret — it bypasses Row Level
   Security).
4. Create a file named `.env.local` in this project's root (it's already in
   `.gitignore`, so it never gets committed) — see `.env.example` for the
   full list of variables.
5. Add the same variables in Vercel: Project Settings > Environment
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

## 3. Connect Shopify

The app reads live Shopify data (revenue, inventory, recent orders) via a
custom app you already created in Shopify's Dev Dashboard ("Heart Magic
HQ", scopes: read_orders, read_products, read_inventory, read_locations,
read_customers).

1. In Vercel, add these env vars (values are in Shopify's Dev Dashboard >
   Heart Magic HQ > Settings > Credentials, and in your store's admin URL):

   ```
   SHOPIFY_API_KEY=<Client ID>
   SHOPIFY_API_SECRET=<Client Secret — reveal it yourself in Shopify's
     dashboard and paste it in; this one's sensitive so it's on you to move
     it, not automation>
   SHOPIFY_SHOP_DOMAIN=e26j0r-jc.myshopify.com
   SHOPIFY_APP_URL=https://hq.heartmagiccacao.com
   ```

2. Also add `SUPABASE_SERVICE_ROLE_KEY` from step 1 if you haven't already
   — the OAuth callback route needs it to store the Shopify token.
3. Redeploy so the new env vars take effect.
4. Visit `https://hq.heartmagiccacao.com/api/shopify/install` once, signed
   in as a store admin. This redirects to Shopify's consent screen, then
   back to `/dashboard` — from then on, the token is stored in Supabase
   (`shopify_connection` table, service-role only) and every dashboard load
   pulls fresh data directly from Shopify's Admin API. No re-auth needed
   unless the token is ever revoked in Shopify.

## 4. Run it locally

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
- Dashboard: the Today View shell. Revenue yesterday, Inventory alerts, and
  Recent orders are live from Shopify once the connection above is set up.
  The remaining briefing lines are honestly marked "Not connected yet"
  until their real data source (Klaviyo sync, reviews ingestion, etc. —
  see `docs/Heart_Magic_OS_Product_Backlog_v1.md`) is wired in.
- Theme: the real Heart Magic brand pack (Deep Red, Warm Gold, Warm Cream,
  Alice/Poppins/Josefin Sans) — not the invented Sprint 1 palette. This
  resolves Backlog decision D2.
- The other six modules (Knowledge, Marketing, Creative, Creators,
  Analytics, Experiments) are stub pages, ready to become real
  Library-backed views per the Content Modules / Knowledge Graph docs.

## What's not built yet

- No database schema (Prisma/Postgres models) for the app's own data —
  nothing but the Shopify token persists yet.
- No seed pipeline from `docs/` into the database (needs the schema first).
- No Klaviyo, reviews, or ad-platform connections yet.
