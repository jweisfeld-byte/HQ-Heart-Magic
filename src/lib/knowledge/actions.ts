"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createEntry,
  setReferencesForEntry,
  setTagsForEntry,
  updateEntry,
} from "./queries";

function readReferences(formData: FormData) {
  const labels = formData.getAll("referenceLabel").map(String);
  const urls = formData.getAll("referenceUrl").map(String);
  return labels.map((label, i) => ({ label, url: urls[i] ?? "" }));
}

// Shared across every mini-hub (/knowledge, /marketing, /creative, ...) —
// one engine, many modules (Application Architecture v1, Section 1).
// Each caller passes its own basePath ("/knowledge", "/marketing") via a
// hidden form field so this logic isn't duplicated per module.

function normalizeBasePath(raw: string): string {
  const basePath = raw.trim();
  return basePath.startsWith("/") ? basePath : `/knowledge`;
}

export async function createEntryAction(formData: FormData) {
  const basePath = normalizeBasePath(String(formData.get("basePath") ?? ""));
  const libraryId = String(formData.get("libraryId") ?? "");
  const libraryKey = String(formData.get("libraryKey") ?? "");
  const entryTypeId = String(formData.get("entryTypeId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  const status = String(formData.get("status") ?? "draft") as
    | "draft"
    | "published"
    | "archived";
  const tagsRaw = String(formData.get("tags") ?? "");
  const references = readReferences(formData);

  if (!libraryId || !entryTypeId || !title) {
    throw new Error("Title and entry type are required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await createEntry({
    libraryId,
    entryTypeId,
    title,
    body,
    status,
    ownerEmail: user?.email ?? null,
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  if (tagsRaw.trim()) {
    await setTagsForEntry(result.id, tagsRaw.split(","));
  }

  await setReferencesForEntry(result.id, references);

  revalidatePath(`${basePath}/${libraryKey}`);
  redirect(`${basePath}/${libraryKey}/${result.id}`);
}

export async function updateEntryAction(formData: FormData) {
  const basePath = normalizeBasePath(String(formData.get("basePath") ?? ""));
  const id = String(formData.get("id") ?? "");
  const libraryKey = String(formData.get("libraryKey") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "");
  const status = String(formData.get("status") ?? "draft") as
    | "draft"
    | "published"
    | "archived";
  const tagsRaw = String(formData.get("tags") ?? "");
  const references = readReferences(formData);

  if (!id || !title) {
    throw new Error("Title is required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await updateEntry(
    id,
    { title, body, status },
    user?.email ?? null,
  );

  if ("error" in result) {
    throw new Error(result.error);
  }

  await setTagsForEntry(id, tagsRaw.split(","));
  await setReferencesForEntry(id, references);

  revalidatePath(`${basePath}/${libraryKey}`);
  revalidatePath(`${basePath}/${libraryKey}/${id}`);
  redirect(`${basePath}/${libraryKey}/${id}`);
}
