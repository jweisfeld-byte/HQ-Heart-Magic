import Link from "next/link";
import { notFound } from "next/navigation";
import { createEntryAction } from "@/lib/knowledge/actions";
import { getEntryTypesForLibrary, getLibraryByKey } from "@/lib/knowledge/queries";

// Shared "New entry" form. basePath decides which module this posts back
// to (/knowledge, /marketing, ...) via a hidden field the shared server
// action reads.
export async function NewEntryFormPage({
  libraryKey,
  basePath,
}: {
  libraryKey: string;
  basePath: string;
}) {
  const library = await getLibraryByKey(libraryKey);
  if (!library) notFound();

  const entryTypes = await getEntryTypesForLibrary(library.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`${basePath}/${library.key}`}
        className="text-sm text-muted hover:text-accent"
      >
        ← {library.name}
      </Link>
      <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
        New entry
      </h1>

      <form action={createEntryAction} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="basePath" value={basePath} />
        <input type="hidden" name="libraryId" value={library.id} />
        <input type="hidden" name="libraryKey" value={library.key} />

        <div>
          <label className="text-sm font-medium text-foreground">Title</label>
          <input
            name="title"
            required
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="e.g. Voice & Tone — v1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            Entry type
          </label>
          <select
            name="entryTypeId"
            required
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            {entryTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            Status
          </label>
          <select
            name="status"
            defaultValue="draft"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            Content
          </label>
          <textarea
            name="body"
            rows={12}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="Write in plain text or Markdown."
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            File URL (optional — e.g. a Google Drive link)
          </label>
          <input
            name="fileUrl"
            type="url"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="https://drive.google.com/..."
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            Tags (comma separated)
          </label>
          <input
            name="tags"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="e.g. voice, tone, launch"
          />
        </div>

        <div className="mt-2 flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Create entry
          </button>
          <Link
            href={`${basePath}/${library.key}`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
