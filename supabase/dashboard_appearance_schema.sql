-- Dashboard Appearance settings
-- Lets Jacob (Settings > Appearance) turn the rainbow border-glow effect
-- on/off app-wide, and upload a custom photo for the dashboard background
-- instead of the default snow-capped-mountain photo. Same singleton
-- organization_settings row used by the Organization settings tab.

alter table organization_settings
  add column if not exists rainbow_glow_enabled boolean not null default true;

alter table organization_settings
  add column if not exists dashboard_background_url text;

-- Storage bucket for uploaded dashboard background photos. Public bucket
-- (readable via URL, no auth) since this is a decorative background image
-- rather than sensitive data — uploads themselves still go through the
-- app's service-role client, which bypasses RLS, so no insert policy is
-- needed here, only a read policy for the public bucket.
insert into storage.buckets (id, name, public)
values ('dashboard-backgrounds', 'dashboard-backgrounds', true)
on conflict (id) do nothing;

drop policy if exists "Public read dashboard backgrounds" on storage.objects;
create policy "Public read dashboard backgrounds"
  on storage.objects for select
  using (bucket_id = 'dashboard-backgrounds');
