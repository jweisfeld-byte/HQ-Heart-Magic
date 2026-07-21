-- Heart Magic HQ — Knowledge module schema
-- Generic Library / EntryType / Entry / EntryVersion / Tag model
-- (Content Modules Architecture v1, Section 1), seeded with the 7
-- Knowledge collections (Knowledge Graph v1, Section 2 + Application
-- Architecture v1, Section 4). group_key exists so the same tables can
-- later hold Marketing's 4 collections and Creative's 2 without a
-- migration — only new Library rows.
--
-- RLS is enabled with zero policies, matching the shopify_connection
-- table: all reads/writes go through the service-role admin client from
-- the server, never directly from the browser.

create table if not exists library (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  icon text not null,
  description text not null,
  group_key text not null, -- 'knowledge' | 'marketing' | 'creative' | ...
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists entry_type (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references library(id) on delete cascade,
  key text not null,
  name text not null,
  sort_order int not null default 0,
  unique (library_id, key)
);

create table if not exists entry (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references library(id) on delete cascade,
  entry_type_id uuid not null references entry_type(id),
  title text not null,
  body text not null default '',
  status text not null default 'draft', -- draft | published | archived
  owner_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists entry_library_idx on entry(library_id);
create index if not exists entry_type_status_idx on entry(entry_type_id, status);

create table if not exists entry_version (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references entry(id) on delete cascade,
  body text not null,
  edited_by text,
  created_at timestamptz not null default now()
);
create index if not exists entry_version_entry_idx on entry_version(entry_id, created_at);

create table if not exists tag (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists entry_tag (
  entry_id uuid not null references entry(id) on delete cascade,
  tag_id uuid not null references tag(id) on delete cascade,
  primary key (entry_id, tag_id)
);

alter table library enable row level security;
alter table entry_type enable row level security;
alter table entry enable row level security;
alter table entry_version enable row level security;
alter table tag enable row level security;
alter table entry_tag enable row level security;

-- Seed: the 7 Knowledge collections + their starting entry types.
insert into library (key, name, icon, description, group_key, sort_order) values
  ('brand-knowledge', 'Brand Knowledge', '📖', 'The authoritative voice/identity layer.', 'knowledge', 1),
  ('product-knowledge', 'Product Knowledge', '🌱', 'Facts about the product itself, not how it''s marketed.', 'knowledge', 2),
  ('customer-psychology', 'Customer Psychology', '🧭', 'Why people buy, hesitate, and churn.', 'knowledge', 3),
  ('sops', 'SOPs', '✅', 'Operational how-to.', 'knowledge', 4),
  ('team-knowledge', 'Team Knowledge', '🧑‍🤝‍🧑', 'People-operations knowledge.', 'knowledge', 5),
  ('wholesale', 'Wholesale', '📦', 'Partner-facing knowledge.', 'knowledge', 6),
  ('future-ideas', 'Future Ideas', '💡', 'Deliberately the loosest-structured collection.', 'knowledge', 7)
on conflict (key) do nothing;

insert into entry_type (library_id, key, name, sort_order)
select l.id, t.key, t.name, t.sort_order
from library l
join (values
  ('brand-knowledge', 'brand-story', 'Brand Story', 1),
  ('brand-knowledge', 'voice-tone', 'Voice & Tone', 2),
  ('brand-knowledge', 'messaging-pillars', 'Messaging Pillars', 3),
  ('brand-knowledge', 'dos-donts', 'Do''s & Don''ts', 4),

  ('product-knowledge', 'formulation-record', 'Formulation Record', 1),
  ('product-knowledge', 'ingredient-reference', 'Ingredient Reference', 2),
  ('product-knowledge', 'sourcing-note', 'Sourcing Note', 3),
  ('product-knowledge', 'product-line-guide', 'Product Line Guide', 4),

  ('customer-psychology', 'buyer-persona', 'Buyer Persona', 1),
  ('customer-psychology', 'objection-response', 'Objection & Response', 2),
  ('customer-psychology', 'pain-point-insight', 'Pain Point Insight', 3),
  ('customer-psychology', 'testimonial-theme', 'Testimonial Theme', 4),

  ('sops', 'sop', 'SOP', 1),
  ('sops', 'exception-log', 'Exception Log', 2),

  ('team-knowledge', 'meeting-note', 'Meeting Note', 1),
  ('team-knowledge', 'role-reference', 'Role Reference', 2),
  ('team-knowledge', 'onboarding-guide', 'Onboarding Guide', 3),
  ('team-knowledge', 'policy-note', 'Policy Note', 4),

  ('wholesale', 'partner-profile', 'Partner Profile', 1),
  ('wholesale', 'pricing-terms-sheet', 'Pricing/Terms Sheet', 2),
  ('wholesale', 'onboarding-checklist', 'Onboarding Checklist', 3),

  ('future-ideas', 'idea', 'Idea', 1)
) as t(library_key, key, name, sort_order) on t.library_key = l.key
on conflict (library_id, key) do nothing;
