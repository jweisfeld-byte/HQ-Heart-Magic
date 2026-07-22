export type Library = {
  id: string;
  key: string;
  name: string;
  icon: string;
  description: string;
  group_key: string;
  sort_order: number;
};

export type EntryType = {
  id: string;
  library_id: string;
  key: string;
  name: string;
  sort_order: number;
};

export type EntryStatus = "draft" | "published" | "archived";

export type Entry = {
  id: string;
  library_id: string;
  entry_type_id: string;
  title: string;
  body: string;
  status: EntryStatus;
  owner_email: string | null;
  // Optional link out to the actual asset (Google Drive, per Content
  // Modules v1's fileRef field) — used by Creative Library entries,
  // left blank elsewhere.
  file_url: string | null;
  // Engineer-defined key/value fields (Content Modules v1's
  // EntryType.fieldSchema) — e.g. Creator Profile's photo/handle/contact
  // fields. Empty object for entry types with no schema wired up.
  structured_fields: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type EntryWithType = Entry & {
  entry_type: Pick<EntryType, "id" | "key" | "name">;
};

export type Tag = {
  id: string;
  name: string;
};

// One entry, many linked docs (Knowledge Graph v1 Section 4's Reference
// model) — a Google Drive link, an article, or a file uploaded straight
// into HQ's own Storage bucket (Jacob's ask: host docs locally,
// alongside Drive linking, not instead of it).
export type Reference = {
  id: string;
  entry_id: string;
  target_type: string; // "url" | "drive_file" | "upload"
  url: string | null;
  drive_file_id: string | null;
  storage_path: string | null;
  label: string;
  created_at: string;
};

// A small, engineer-defined set of key/value fields for one entry type
// (Content Modules v1 Section 1: "never end-user-editable"). Passed in by
// a module's route wrapper (e.g. Creators), not something the generic
// engine invents on its own.
export type FieldSchemaField = {
  key: string;
  label: string;
  type: "text" | "url" | "email" | "tel";
};
