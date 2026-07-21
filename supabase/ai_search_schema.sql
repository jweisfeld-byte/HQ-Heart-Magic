-- AI Search (MVP): keyword search across every generic-engine entry
-- (Knowledge/Marketing/Creative/Creators/Analytics/Experiments), then a
-- single Claude call synthesizes a grounded answer citing only what was
-- actually retrieved. This table logs each query for cost visibility and
-- so "what people actually ask" is reviewable later (AI Search v1 doc,
-- Section 3) — no new column on `entry`, no vector/embeddings pipeline
-- yet, consistent with the scoped-down MVP.
--
-- Same RLS pattern as every other table here: service-role-only access.

create table if not exists ai_search_query (
  id uuid primary key default gen_random_uuid(),
  query_text text not null,
  answer text,
  retrieved_entry_ids jsonb not null default '[]'::jsonb,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists ai_search_query_created_idx on ai_search_query(created_at);

alter table ai_search_query enable row level security;
