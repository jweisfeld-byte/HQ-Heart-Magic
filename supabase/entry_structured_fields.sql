-- Heart Magic HQ — structured fields
-- Adds entry.structured_fields, the concrete implementation of Content
-- Modules v1's EntryType.fieldSchema idea: "engineer-defined structured
-- template... never end-user-editable" (Section 1). Used first by
-- Creator Profile (photo, handle, contact email/phone, socials) so
-- Creators can render as photo cards with a proper profile page, but the
-- column is generic — any entry type can carry a small set of key/value
-- fields the same way later, just by defining a new FieldSchema in
-- src/lib/knowledge/fieldSchemas.ts. Blank/unused for every entry that
-- doesn't have a schema wired up (no impact on Knowledge/Marketing/most
-- of Creative).

alter table entry add column if not exists structured_fields jsonb not null default '{}'::jsonb;
