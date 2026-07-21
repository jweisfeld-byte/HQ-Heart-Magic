import { createAdminClient } from "@/lib/supabase/admin";
import type { Entry, EntryType, EntryWithType, Library, Tag } from "./types";

/**
 * Every query here fails gracefully (returns null/[] rather than throwing)
 * so pages can render an honest "not set up yet" state if the schema in
 * supabase/knowledge_schema.sql hasn't been run yet, the same convention
 * used for the Shopify integration (src/lib/shopify/client.ts).
 */

export async function getLibrariesByGroup(
  groupKey: string,
): Promise<Library[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("library")
      .select("*")
      .eq("group_key", groupKey)
      .order("sort_order", { ascending: true });

    if (error) return null;
    return data as Library[];
  } catch {
    return null;
  }
}

export async function getLibraryByKey(key: string): Promise<Library | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("library")
      .select("*")
      .eq("key", key)
      .maybeSingle();

    if (error || !data) return null;
    return data as Library;
  } catch {
    return null;
  }
}

export async function getEntryCountsByLibrary(
  libraryIds: string[],
): Promise<Record<string, number>> {
  if (libraryIds.length === 0) return {};

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("entry")
      .select("library_id")
      .in("library_id", libraryIds);

    if (error || !data) return {};

    const counts: Record<string, number> = {};
    for (const row of data as { library_id: string }[]) {
      counts[row.library_id] = (counts[row.library_id] ?? 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}

export async function getEntryTypesForLibrary(
  libraryId: string,
): Promise<EntryType[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("entry_type")
      .select("*")
      .eq("library_id", libraryId)
      .order("sort_order", { ascending: true });

    if (error || !data) return [];
    return data as EntryType[];
  } catch {
    return [];
  }
}

export async function getEntriesForLibrary(
  libraryId: string,
  opts: { entryTypeId?: string } = {},
): Promise<EntryWithType[] | null> {
  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("entry")
      .select("*, entry_type:entry_type_id(id, key, name)")
      .eq("library_id", libraryId)
      .order("updated_at", { ascending: false });

    if (opts.entryTypeId) {
      query = query.eq("entry_type_id", opts.entryTypeId);
    }

    const { data, error } = await query;
    if (error) return null;
    return data as unknown as EntryWithType[];
  } catch {
    return null;
  }
}

export async function getEntryById(id: string): Promise<EntryWithType | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("entry")
      .select("*, entry_type:entry_type_id(id, key, name)")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data as unknown as EntryWithType;
  } catch {
    return null;
  }
}

export async function getTagsForEntry(entryId: string): Promise<Tag[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("entry_tag")
      .select("tag:tag_id(id, name)")
      .eq("entry_id", entryId);

    if (error || !data) return [];
    return (data as unknown as { tag: Tag }[]).map((row) => row.tag);
  } catch {
    return [];
  }
}

export async function createEntry(input: {
  libraryId: string;
  entryTypeId: string;
  title: string;
  body: string;
  ownerEmail: string | null;
  status: Entry["status"];
}): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("entry")
      .insert({
        library_id: input.libraryId,
        entry_type_id: input.entryTypeId,
        title: input.title,
        body: input.body,
        owner_email: input.ownerEmail,
        status: input.status,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: error?.message ?? "Failed to create entry." };
    }
    return { id: data.id as string };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function updateEntry(
  id: string,
  input: { title: string; body: string; status: Entry["status"] },
  editedBy: string | null,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();

    // Snapshot the current body into entry_version before overwriting it,
    // so History (Content Modules §1, EntryVersion) has something in it.
    const { data: current } = await supabase
      .from("entry")
      .select("body")
      .eq("id", id)
      .maybeSingle();

    if (current) {
      await supabase.from("entry_version").insert({
        entry_id: id,
        body: current.body,
        edited_by: editedBy,
      });
    }

    const { error } = await supabase
      .from("entry")
      .update({
        title: input.title,
        body: input.body,
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function setTagsForEntry(
  entryId: string,
  tagNames: string[],
): Promise<void> {
  const supabase = createAdminClient();

  const cleaned = Array.from(
    new Set(tagNames.map((t) => t.trim()).filter(Boolean)),
  );

  await supabase.from("entry_tag").delete().eq("entry_id", entryId);

  if (cleaned.length === 0) return;

  for (const name of cleaned) {
    const { data: existing } = await supabase
      .from("tag")
      .select("id")
      .eq("name", name)
      .maybeSingle();

    let tagId = existing?.id as string | undefined;

    if (!tagId) {
      const { data: created } = await supabase
        .from("tag")
        .insert({ name })
        .select("id")
        .single();
      tagId = created?.id as string | undefined;
    }

    if (tagId) {
      await supabase
        .from("entry_tag")
        .upsert({ entry_id: entryId, tag_id: tagId });
    }
  }
}
