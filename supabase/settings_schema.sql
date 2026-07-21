-- Heart Magic HQ — Settings schema
-- Backs the 4 Settings screens from Screens & Flows v1 Section 3
-- (Integrations, Roles & Permissions, Organization, Profile). Same
-- RLS-enabled/service-role-only pattern as every other table in this app.

-- Organization — a single row of org-wide defaults (name, currency,
-- timezone). Single-tenant today (one company), so this is a singleton
-- rather than a multi-org table — matches the app's actual shape rather
-- than building multi-tenancy nothing here needs yet.
create table if not exists organization_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Heart Magic',
  default_currency text not null default 'USD',
  timezone text not null default 'America/Chicago',
  updated_at timestamptz not null default now()
);
insert into organization_settings (name, default_currency, timezone)
select 'Heart Magic', 'USD', 'America/Chicago'
where not exists (select 1 from organization_settings);

-- Roles & Permissions — an informational role label per person. This is
-- a directory, not enforcement: nothing in the app currently gates a
-- page or action by role. Recording it here is still useful (it's the
-- record of who's an Owner/Admin/Member/Guest) and is the natural place
-- to hang real enforcement later without a schema change.
create table if not exists user_role (
  email text primary key,
  role text not null default 'member', -- 'owner' | 'admin' | 'member' | 'guest'
  updated_at timestamptz not null default now()
);

alter table organization_settings enable row level security;
alter table user_role enable row level security;
