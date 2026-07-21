-- Events tab (Screens & Flows-style month calendar): upcoming events,
-- each assigned to a team member, with a point of contact and notes.
-- Same RLS pattern as every other table in this app (service-role-only
-- access, zero policies) — see wholesale_schema.sql / tasks_schema.sql.

create table if not exists event (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  assignee_email text,
  point_of_contact text not null default '',
  notes text not null default '',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_date_idx on event(event_date);
create index if not exists event_assignee_idx on event(assignee_email);

alter table event enable row level security;
