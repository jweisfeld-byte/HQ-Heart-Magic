import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Local document hosting — uploads a real file into the shared
 * `hq-documents` Storage bucket (see supabase/local_documents_schema.sql)
 * so a document can live directly in HQ instead of only being linked out
 * to Google Drive. Public bucket, same reasoning as
 * dashboard-backgrounds: uploads go through the service-role admin
 * client (bypasses RLS), so only a public read policy is needed. Public
 * read means anyone with the URL can view it, same trust model as a
 * "shared" Google Drive link.
 */

const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024; // 20MB

export type UploadedDocument = {
  url: string;
  path: string;
  name: string;
};

export async function uploadDocument(
  file: File,
): Promise<{ ok: true; document: UploadedDocument } | { error: string }> {
  if (!file || file.size === 0) {
    return { error: "Choose a file first." };
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return { error: "File is too large (20MB max)." };
  }

  try {
    const supabase = createAdminClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-") || "file";
    const path = `${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("hq-documents")
      .upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) return { error: uploadError.message };

    const { data: publicUrlData } = supabase.storage
      .from("hq-documents")
      .getPublicUrl(path);

    return {
      ok: true,
      document: { url: publicUrlData.publicUrl, path, name: file.name },
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Upload failed." };
  }
}

// Best-effort cleanup — called when a reference/asset carrying an
// uploaded file is deleted or replaced. Failures are swallowed (the
// Storage object just becomes orphaned, which is harmless) rather than
// blocking the delete the user actually asked for.
export async function deleteDocument(path: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.storage.from("hq-documents").remove([path]);
  } catch {
    // Swallowed intentionally — see comment above.
  }
}
