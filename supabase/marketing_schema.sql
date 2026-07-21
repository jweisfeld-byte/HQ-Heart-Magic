-- Heart Magic HQ — Marketing module seed
-- No new tables: this reuses the generic Library/EntryType/Entry schema
-- created by supabase/knowledge_schema.sql (which must be run first).
-- Adds the 4 Marketing collections (Knowledge Graph v1 Section 2,
-- Application Architecture v1 Section 4) as new Library rows with
-- group_key = 'marketing' — exactly the "new module = a data insert,
-- not a migration" claim the architecture docs make.

insert into library (key, name, icon, description, group_key, sort_order) values
  ('marketing', 'Marketing', '🎯', 'Channel-agnostic strategy and cadence.', 'marketing', 1),
  ('meta-ads', 'Meta Ads', '📣', 'Meta-specific angles, creative testing, and policy nuance.', 'marketing', 2),
  ('advertorials', 'Advertorials', '📰', 'A specific content format with its own conventions.', 'marketing', 3),
  ('email', 'Email', '✉️', 'Klaviyo-adjacent knowledge — how flows/campaigns get built.', 'marketing', 4)
on conflict (key) do nothing;

insert into entry_type (library_id, key, name, sort_order)
select l.id, t.key, t.name, t.sort_order
from library l
join (values
  ('marketing', 'general-playbook', 'General Playbook', 1),
  ('marketing', 'calendar-cadence-reference', 'Calendar Cadence Reference', 2),
  ('marketing', 'positioning-note', 'Positioning Note', 3),

  ('meta-ads', 'ad-angle', 'Ad Angle', 1),
  ('meta-ads', 'ad-creative-brief', 'Ad Creative Brief', 2),
  ('meta-ads', 'performance-learning', 'Performance Learning', 3),
  ('meta-ads', 'audience-note', 'Audience Note', 4),

  ('advertorials', 'advertorial-template', 'Advertorial Template', 1),
  ('advertorials', 'published-reference', 'Published Reference', 2),
  ('advertorials', 'landing-page-copy-pattern', 'Landing Page Copy Pattern', 3),

  ('email', 'flow-blueprint', 'Flow Blueprint', 1),
  ('email', 'subject-line-bank', 'Subject Line Bank', 2),
  ('email', 'campaign-retro', 'Campaign Retro', 3)
) as t(library_key, key, name, sort_order) on t.library_key = l.key
on conflict (library_id, key) do nothing;
