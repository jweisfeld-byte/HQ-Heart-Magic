-- Heart Magic HQ — Experiments module seed
-- No new tables: reuses the generic Library/EntryType/Entry schema from
-- knowledge_schema.sql. One collection, no mini-hub in front of it
-- (Application Architecture v1 Section 4: "Experiments → straight to
-- List View"). Structured hypothesis → test → result records — turning
-- "we tried that once" into a queryable history (Knowledge Graph v1
-- Section 2).

insert into library (key, name, icon, description, group_key, sort_order) values
  ('experiments', 'Experiments', '🧪', 'Every test as one object: hypothesis, results, learnings, winner.', 'experiments', 1)
on conflict (key) do nothing;

insert into entry_type (library_id, key, name, sort_order)
select l.id, t.key, t.name, t.sort_order
from library l
join (values
  ('experiments', 'hypothesis', 'Hypothesis', 1),
  ('experiments', 'test-record', 'Test Record', 2),
  ('experiments', 'result-learning', 'Result & Learning', 3)
) as t(library_key, key, name, sort_order) on t.library_key = l.key
on conflict (library_id, key) do nothing;
