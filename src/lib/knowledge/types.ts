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
