"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createEntry,
  deleteEntry,
  setReferencesForEntry,
  setTagsForEntry,
  updateEntry,
} from "./queries";

function readReferences(formData: FormData) {
  const labels = formData.getAll("referenceLabel").map(String);
  const urls = formData.getAll("referenceUrl").map(String);
  const driveFileIds = formData.getAll("referenceDriveFileId").map(String);
  return labels.map((label, i) => ({
    label,
    url: urls[i] ?? "",
    driveFileId: driveFileIds[i] || undefined,
  }));
}

// Any input named "field_<key>" is a structured field (Content Modules
// v1's fieldSchema) — collected purely by naming convention so this
// action never needs to know which module's schema sent it.
function readStructuredFields(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("field_") && typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) out[key.slice("field_".length)] = trimmed;
    }
  }
  return out;
}

// Shared across every mini-hub (/knowledge, /marketing, /creative, ...) —
// one engine, many modules (Application Architecture v1, Section 1).
// Each caller passes its own basePath ("/knowledge", "/marketing") via a
// hidden form field so this logic isn't duplicated per module. `flat`
// (Creators, Analytics, Experiments — single-collection destinations
// that skip the mini-hub) means the list/detail routes are
// basePath/[id] rather than basePath/[libraryKey]/[id].

function normalizeBasePath(raw: string): string {
  const basePath = raw.trim();
  return basePath.startsWith("/") ? basePath : `/knowledge`;
}

export async function createEntryAction(formData: FormData) {
  const basePath = normalizeBasePath(String(formData.get("basePath") ?? ""));
  const flat = String(formData.get("flat") ?? "") === "1";
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
  const structuredFields = readStructuredFields(formData);

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
    structuredFields,
    ownerEmail: user?.email ?? null,
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  if (tagsRaw.trim()) {
    await setTagsForEntry(result.id, tagsRaw.split(","));
  }

  await setReferencesForEntry(result.id, references);

  const listPath = flat ? basePath : `${basePath}/${libraryKey}`;
  revalidatePath(listPath);
  redirect(`${listPath}/${result.id}`);
}

export async function updateEntryAction(formData: FormData) {
  const basePath = normalizeBasePath(String(formData.get("basePath") ?? ""));
  const flat = String(formData.get("flat") ?? "") === "1";
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
  const structuredFields = readStructuredFields(formData);

  if (!id || !title) {
    throw new Error("Title is required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await updateEntry(
    id,
    { title, body, status, structuredFields },
    user?.email ?? null,
  );

  if ("error" in result) {
    throw new Error(result.error);
  }

  await setTagsForEntry(id, tagsRaw.split(","));
  await setReferencesForEntry(id, references);

  const listPath = flat ? basePath : `${basePath}/${libraryKey}`;
  revalidatePath(listPath);
  revalidatePath(`${listPath}/${id}`);
  redirect(`${listPath}/${id}`);
}

export async function deleteEntryAction(formData: FormData) {
  const basePath = normalizeBasePath(String(formData.get("basePath") ?? ""));
  const flat = String(formData.get("flat") ?? "") === "1";
  const id = String(formData.get("id") ?? "");
  const libraryKey = String(formData.get("libraryKey") ?? "");

  if (!id) {
    throw new Error("Missing entry id.");
  }

  const result = await deleteEntry(id);
  if ("error" in result) {
    throw new Error(result.error);
  }

  const listPath = flat ? basePath : `${basePath}/${libraryKey}`;
  revalidatePath(listPath);
  redirect(listPath);
}
