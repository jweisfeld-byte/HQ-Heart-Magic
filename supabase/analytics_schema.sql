-- Heart Magic HQ — Analytics module seed
-- No new tables: reuses the generic Library/EntryType/Entry schema from
-- knowledge_schema.sql. One collection, no mini-hub in front of it
-- (Application Architecture v1 Section 4: "Analytics → straight to List
-- View"). This is the interpretation layer on top of the Finance/
-- Commerce dashboards — definitions and takeaways, not raw numbers
-- (Knowledge Graph v1 Section 2).

insert into library (key, name, icon, description, group_key, sort_order) values
  ('analytics', 'Analytics', '📊', 'Metric definitions and takeaways — the interpretation layer on top of the raw dashboards.', 'analytics', 1)
on conflict (key) do nothing;

insert into entry_type (library_id, key, name, sort_order)
select l.id, t.key, t.name, t.sort_order
from library l
join (values
  ('analytics', 'metric-definition', 'Metric Definition', 1),
  ('analytics', 'insight-note', 'Insight Note', 2),
  ('analytics', 'recurring-report-template', 'Recurring Report Template', 3)
) as t(library_key, key, name, sort_order) on t.library_key = l.key
on conflict (library_id, key) do nothing;
