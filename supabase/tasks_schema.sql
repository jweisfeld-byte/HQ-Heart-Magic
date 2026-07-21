-- Heart Magic HQ — Tasks schema
-- A dedicated table (like wholesale_account), not the generic
-- Library/Entry engine — a task board needs a queryable status/assignee/
-- due date, not a JSON blob. Single flat team board for now, not a
-- multi-project hierarchy (PRD's fuller "Projects & Tasks" domain is a
-- bigger future piece; this is the Monday.com-style board Jacob asked
-- for today).
--
-- Same RLS-enabled/service-role-only pattern as every other table here.

create table if not exists task (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  status text not null default 'not_started', -- not_started | working_on_it | stuck | done
  assignee_email text,
  due_date date,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists task_status_idx on task(status);
create index if not exists task_assignee_idx on task(assignee_email);

alter table task enable row level security;
