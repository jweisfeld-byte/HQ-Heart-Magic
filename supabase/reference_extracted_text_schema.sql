-- Heart Magic HQ — extracted text for uploaded PDF references
--
-- Jacob's question: "why can't [the assistant] read what's in the
-- document" — the HQ Assistant and AI Search only ever read the
-- entry.body text column. A linked document (e.g. a PDF uploaded via
-- the Knowledge references editor) is just a link + label; its actual
-- content was never extracted anywhere, so an entry with real content
-- sitting in an attached PDF but nothing typed into its body field
-- looked (correctly) empty to both features.
--
-- This adds a place to persist that content once, at save time, so it
-- doesn't need to be re-downloaded/re-parsed on every search or chat
-- message. Only populated for target_type = 'upload' PDFs (files HQ
-- hosts itself in Supabase Storage) — Drive files aren't fetchable
-- without the owner's OAuth token, and arbitrary pasted URLs aren't
-- necessarily PDFs or even safe/cheap to fetch server-side.

alter table reference add column if not exists extracted_text text;
