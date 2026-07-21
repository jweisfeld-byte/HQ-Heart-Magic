-- Heart Magic HQ — Revenue Recommendations
-- Caches one AI-generated "what's the one thing you can do today to
-- drive the most revenue" recommendation per person per day (Jacob's
-- ask, under Today's tasks on the dashboard). Generated once per person
-- per day on first dashboard load that day, then served from here for
-- the rest of the day rather than re-calling Claude on every page view.

create table if not exists revenue_recommendation (
  id uuid primary key default gen_random_uuid(),
  person_name text not null,
  recommendation_date date not null,
  recommendation text not null,
  created_at timestamptz not null default now(),
  unique (person_name, recommendation_date)
);

create index if not exists revenue_recommendation_lookup_idx
  on revenue_recommendation(person_name, recommendation_date);

alter table revenue_recommendation enable row level security;
