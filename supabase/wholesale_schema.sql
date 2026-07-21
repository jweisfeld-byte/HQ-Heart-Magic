-- Heart Magic HQ — Wholesale CRM schema
-- Wholesale/Retail Pipeline was explicitly named in the PRD as a future
-- domain ("the data model should anticipate it") — this is that domain,
-- built as its own dedicated tables rather than another generic
-- Library/Entry module, because a real CRM needs a queryable stage and
-- follow-up date, not a JSON blob. (Reference-doc knowledge about
-- wholesale, e.g. a general Pricing/Terms template, still lives at
-- /knowledge/wholesale — this is the live pipeline of actual businesses.)
--
-- Same RLS-enabled/service-role-only pattern as every other table here.

create table if not exists wholesale_account (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  address text,
  stage text not null default 'lead', -- lead | sample_sent | negotiating | active | churned
  owner_email text,
  next_follow_up_at date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists wholesale_account_stage_idx on wholesale_account(stage);

-- One row per logged touch (call, email, sample sent, meeting) — the
-- actual "we followed up on X date and here's what happened" record
-- that the automated-followups goal will eventually read/write too.
create table if not exists wholesale_activity (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references wholesale_account(id) on delete cascade,
  note text not null,
  logged_by text,
  created_at timestamptz not null default now()
);
create index if not exists wholesale_activity_account_idx on wholesale_activity(account_id, created_at);

alter table wholesale_account enable row level security;
alter table wholesale_activity enable row level security;
