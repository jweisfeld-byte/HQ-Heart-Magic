# Heart Magic HQ — Setup

This app is scaffolded (Next.js 16, App Router, TypeScript, Tailwind v4) with
Supabase Auth wired in, but needs a few things from you before sign-in and
the live data connections work.

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
6. Run every `supabase/*.sql` file in the SQL Editor (in any order — each
   one either creates its own tables or seeds into ones already created by
   `knowledge_schema.sql`, which should go first).

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

## 4. Connect Google Drive (file picker)

Every "Linked documents" field (on any Knowledge/Marketing/Creative/
Wholesale entry) has a "📎 Pick from Google Drive" button that opens
Google's real file picker instead of pasting a URL by hand. Per Technical
Architecture v1 Section 6, this is a *linked reference* — HQ never copies
or stores the file itself, only its name and link.

This reuses the same Google Cloud project as sign-in (step 2), so it's a
few small additions there, not a new app:

1. **Enable the Picker API.** Google Cloud Console > APIs & Services >
   Library > search "Google Picker API" > Enable.
2. **Add this app's URL as an authorized JavaScript origin** on the
   *existing* OAuth Client ID from step 2 (APIs & Services > Credentials >
   click the Client ID > Authorized JavaScript origins > Add URI):
   ```
   https://hq.heartmagiccacao.com
   ```
   (Also add `http://localhost:3000` here if you want the picker to work
   in local dev.)
3. **Create a new API key** for the Picker (APIs & Services > Credentials >
   Create Credentials > API Key). Then click into it and restrict it:
   - **Application restrictions:** HTTP referrers, add
     `https://hq.heartmagiccacao.com/*`
   - **API restrictions:** restrict to "Google Picker API" only.

   This key is meant to be public (it's used client-side, like a Google
   Maps embed key) — the referrer + API restriction is what keeps it safe
   to expose, not secrecy.
4. In Vercel, add:

   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=<the same OAuth Client ID from step 2>
   NEXT_PUBLIC_GOOGLE_PICKER_API_KEY=<the API key you just created>
   ```

5. Redeploy. The first time anyone clicks "Pick from Google Drive" they'll
   see a one-time Google consent popup asking to let Heart Magic HQ see the
   specific file they pick (`drive.file` scope — least privilege, not
   access to the whole Drive). After that it just opens the picker.

## 5. Run it locally

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
- Nav: Dashboard, Knowledge, Marketing, Creative, Creators, Analytics,
  Experiments, Wholesale, Settings.
- Dashboard: the Today View shell. Revenue yesterday, Inventory alerts, and
  Recent orders are live from Shopify once the connection above is set up.
  The remaining briefing lines are honestly marked "Not connected yet"
  until their real data source (Klaviyo sync, reviews ingestion, etc. —
  see `docs/Heart_Magic_OS_Product_Backlog_v1.md`) is wired in.
- Theme: the real Heart Magic brand pack (Deep Red, Warm Gold, Warm Cream,
  Alice/Poppins/Josefin Sans), with a manual light/dark override in
  Settings > Profile on top of the automatic OS-level default.
- Knowledge (7 collections), Marketing (4), Creative (2), plus Creators,
  Analytics, and Experiments standalone: all real, backed by the generic
  Library/EntryType/Entry schema (`supabase/knowledge_schema.sql` +
  `marketing_schema.sql` + `creative_schema.sql` + `creators_schema.sql` +
  `analytics_schema.sql` + `experiments_schema.sql`) — List/Detail/Create
  views, tags, linked documents (now with a real Drive picker), and
  Creator Profile's photo-card gallery (`entry_structured_fields.sql`).
- Wholesale: a real CRM (`wholesale_schema.sql`) — pipeline board by
  stage, business records, and an activity log per business.
- Settings: Profile, Organization, Integrations (live Shopify status),
  and Roles & Permissions (a directory, not enforcement yet) —
  `settings_schema.sql`.

## What's not built yet

- No Klaviyo, reviews, or ad-platform connections. (Klaviyo is confirmed
  reachable — see the Wholesale CRM's automated-followups discussion —
  just not wired into the app yet.)
- No search (hybrid tsvector + pgvector), AI summaries, or ObjectRelation
  cross-linking between entries yet — every module today is List/Detail/
  Create only.
- No per-module ModuleDashboard stat strips (Experiments' win rate,
  Meta Ads' tested-vs-untested, etc.).
- Roles & Permissions is a label, not access control — every signed-in
  Workspace user currently sees everything.
- Google Drive bulk-import (auto-creating entries from an existing Drive
  folder) — today's integration is picker-based linking only.
