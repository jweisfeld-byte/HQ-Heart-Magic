-- Heart Magic HQ — Reference (linked documents) schema
-- One entry, many linked docs: the `Reference` model from Knowledge Graph
-- v1 Section 4 — "external citations only — a link to an article, a
-- not-yet-imported Drive file, a Shopify report." This replaces the
-- single entry.file_url field added in creative_schema.sql with a proper
-- one-to-many list, so any entry in any module (Knowledge, Marketing,
-- Creative) can have several linked Google Drive docs, not just one.
--
-- entry.file_url is left in place (unused going forward, harmless) —
-- no destructive migration needed.

create table if not exists reference (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entry(id) on delete cascade,
  target_type text not null default 'drive_file', -- 'url' | 'drive_file'
  url text,
  drive_file_id text,
  label text not null,
  created_at timestamptz not null default now()
);
create index if not exists reference_entry_idx on reference(entry_id);

alter table reference enable row level security;
