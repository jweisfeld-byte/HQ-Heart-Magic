-- Meta Marketing API connection (Jacob's own ad account only — Standard
-- Access via a System User token, no App Review needed) plus the columns
-- on funnel_stage_asset that let a specific Meta ad be manually linked to
-- a specific funnel format ("Manual picker" approach, confirmed with
-- Jacob over auto-matching by naming convention).

create table if not exists meta_connection (
  ad_account_id text primary key,
  access_token text not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table meta_connection enable row level security;

drop policy if exists "service role full access" on meta_connection;
create policy "service role full access" on meta_connection
  for all using (true) with check (true);

alter table funnel_stage_asset add column if not exists meta_ad_id text;
alter table funnel_stage_asset add column if not exists meta_ad_name text;
alter table funnel_stage_asset add column if not exists meta_ad_thumbnail_url text;
