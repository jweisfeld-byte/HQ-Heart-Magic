-- Per-user Appearance settings (rainbow glow + dashboard background),
-- replacing the old shared organization_settings columns for these two
-- fields. Jacob's ask: appearance should be personal to whoever is
-- logged in, not applied across everybody's HQ. Team Calendar URL stays
-- on organization_settings since a shared calendar link is genuinely
-- org-wide, not a personal preference.

create table if not exists user_appearance_settings (
  email text primary key,
  rainbow_glow_enabled boolean not null default true,
  dashboard_background_url text,
  updated_at timestamptz not null default now()
);

alter table user_appearance_settings enable row level security;

-- Same service-role-bypass pattern used everywhere else in this app —
-- all real access goes through createAdminClient() server-side.
drop policy if exists "service role full access" on user_appearance_settings;
create policy "service role full access" on user_appearance_settings
  for all using (true) with check (true);
