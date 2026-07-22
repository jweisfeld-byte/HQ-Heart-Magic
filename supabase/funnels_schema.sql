-- Heart Magic HQ — Funnels (Marketing tab)
-- A funnel is visualized as a triangle, divided into horizontal bands
-- top-to-bottom, one per stage (e.g. Awareness at the wide top, down
-- to Conversion at the narrow tip) — the same rounded-triangle
-- geometry as the Projects progress pyramid, reused for a different
-- job here. Each stage can have a Google Drive file attached (the
-- actual creative/asset for that step of the funnel), via the same
-- Drive Picker already used on Knowledge entries. Same RLS-enabled/
-- service-role-only pattern as every other table in this app.

create table if not exists funnel (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists funnel_stage (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references funnel(id) on delete cascade,
  name text not null,
  position int not null default 0,
  size_percent numeric, -- null = split evenly across a funnel's stages
  file_label text,
  file_url text,
  drive_file_id text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists funnel_stage_funnel_idx on funnel_stage(funnel_id);
create index if not exists funnel_stage_position_idx on funnel_stage(funnel_id, position);

alter table funnel enable row level security;
alter table funnel_stage enable row level security;
