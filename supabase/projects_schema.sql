-- Heart Magic HQ — Projects schema
-- A lightweight grouping layer over the existing Tasks board (Jacob's
-- ask: "make a Projects tab"). Each project shows as a pyramid — one
-- horizontal slice per task, sized/labeled by that task's share of the
-- project (100 / task count), black until the task is done, rainbow
-- once it is. Tasks keep working exactly as before when not attached
-- to a project (project_id is nullable).
--
-- Same RLS-enabled/service-role-only pattern as every other table here.

create table if not exists project (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table task
  add column if not exists project_id uuid references project(id) on delete set null;

create index if not exists task_project_idx on task(project_id);

alter table project enable row level security;
