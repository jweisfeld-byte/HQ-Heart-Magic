-- Heart Magic HQ — Creative module seed
-- No new tables for the collections themselves — reuses the generic
-- Library/EntryType/Entry schema from knowledge_schema.sql (run that
-- first if you haven't). Adds one small column: entry.file_url, an
-- optional link out to the actual asset. Creative Library entries are
-- references to files that live in Google Drive (per Content Modules v1's
-- fileRef field and this app's original Creative stub text, "indexed from
-- Google Drive") rather than files uploaded into this app directly.

alter table entry add column if not exists file_url text;

insert into library (key, name, icon, description, group_key, sort_order) values
  ('ugc', 'UGC', '🎥', 'Creator-sourced content strategy.', 'creative', 1),
  ('creative-library', 'Creative Library', '🖼️', 'The raw asset repository — photos, video, logos, packaging files.', 'creative', 2)
on conflict (key) do nothing;

insert into entry_type (library_id, key, name, sort_order)
select l.id, t.key, t.name, t.sort_order
from library l
join (values
  ('ugc', 'creator-brief', 'Creator Brief', 1),
  ('ugc', 'script-template', 'Script Template', 2),
  ('ugc', 'content-example-analysis', 'Content Example Analysis', 3),

  ('creative-library', 'photo', 'Photo', 1),
  ('creative-library', 'video', 'Video', 2),
  ('creative-library', 'logo-mark', 'Logo/Mark', 3),
  ('creative-library', 'packaging-file', 'Packaging File', 4),
  ('creative-library', 'font-type-asset', 'Font/Type Asset', 5)
) as t(library_key, key, name, sort_order) on t.library_key = l.key
on conflict (library_id, key) do nothing;
