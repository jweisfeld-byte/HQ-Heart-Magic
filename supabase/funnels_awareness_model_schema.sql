-- Heart Magic HQ — Funnels: awareness-model update
-- Restructures each funnel stage to match Jacob's reference model (the
-- classic 5-stage awareness funnel: Unaware -> Problem Aware ->
-- Solution Aware -> Product Aware -> Most Aware), where each stage
-- carries its own creative strategy description AND can hold several
-- named creative formats (not just one file) — e.g. Unaware might have
-- an Educational Content piece, a Founder Story Ad, a Core Problem
-- piece, and a Statistic-Based piece, each its own Google Drive
-- attachment.

alter table funnel_stage
  add column if not exists strategy text not null default '';

create table if not exists funnel_stage_asset (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references funnel_stage(id) on delete cascade,
  label text not null,
  position int not null default 0,
  file_label text,
  file_url text,
  drive_file_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists funnel_stage_asset_stage_idx on funnel_stage_asset(stage_id);
create index if not exists funnel_stage_asset_position_idx on funnel_stage_asset(stage_id, position);

alter table funnel_stage_asset enable row level security;
