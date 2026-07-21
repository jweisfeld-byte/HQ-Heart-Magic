-- Heart Magic HQ — Creators module seed
-- No new tables: reuses the generic Library/EntryType/Entry schema from
-- knowledge_schema.sql. One collection, no mini-hub in front of it
-- (Application Architecture v1 Section 4: "Creators → Creator Knowledge,
-- goes straight to List View — one collection doesn't need a hub in
-- front of it").

insert into library (key, name, icon, description, group_key, sort_order) values
  ('creator-knowledge', 'Creator Knowledge', '🤝', 'The creator/affiliate roster — who they are, terms, performance.', 'creators', 1)
on conflict (key) do nothing;

insert into entry_type (library_id, key, name, sort_order)
select l.id, t.key, t.name, t.sort_order
from library l
join (values
  ('creator-knowledge', 'creator-profile', 'Creator Profile', 1),
  ('creator-knowledge', 'partnership-terms', 'Partnership Terms', 2),
  ('creator-knowledge', 'outreach-template', 'Outreach Template', 3)
) as t(library_key, key, name, sort_order) on t.library_key = l.key
on conflict (library_id, key) do nothing;
