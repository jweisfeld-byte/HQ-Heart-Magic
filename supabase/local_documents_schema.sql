-- Local document hosting — upload a real file into Supabase Storage
-- instead of only linking out to Google Drive. Sits alongside the
-- existing Drive-link path (both stay available), for Knowledge entries
-- (the `reference` table) and funnel formats (`funnel_stage_asset`).

insert into storage.buckets (id, name, public)
values ('hq-documents', 'hq-documents', true)
on conflict (id) do nothing;

drop policy if exists "Public read hq documents" on storage.objects;
create policy "Public read hq documents"
  on storage.objects for select
  using (bucket_id = 'hq-documents');

-- reference.target_type already accepted 'url' | 'drive_file'
-- (references_schema.sql) — 'upload' is a new third value for files
-- hosted in the hq-documents bucket above.
alter table reference add column if not exists storage_path text;

-- funnel_stage_asset already has file_label/file_url/drive_file_id
-- (funnels_awareness_model_schema.sql) — an upload just sets file_url
-- to the Storage public URL and leaves drive_file_id null, with
-- storage_path additionally recorded.
alter table funnel_stage_asset add column if not exists storage_path text;
