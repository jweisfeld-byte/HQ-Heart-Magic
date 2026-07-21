-- Heart Magic HQ — Projects v2 schema
-- Three follow-up asks on top of supabase/projects_schema.sql:
--   1. Multiple people can be assigned to a project (not just one owner).
--   2. Each task gets a manually-entered % share of its project, instead
--      of the pyramid splitting every task's slice equally.
--   3. Tasks can repeat weekly or monthly.

alter table project
  add column if not exists assignee_emails text[] not null default '{}';

alter table task
  add column if not exists project_percent numeric;

alter table task
  add column if not exists recurrence text; -- null | 'weekly' | 'monthly'
