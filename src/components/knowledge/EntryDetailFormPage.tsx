import Link from "next/link";
import { notFound } from "next/navigation";
import { updateEntryAction } from "@/lib/knowledge/actions";
import {
  getEntryById,
  getLibraryByKey,
  getReferencesForEntry,
  getTagsForEntry,
} from "@/lib/knowledge/queries";
import { ReferencesEditor } from "@/components/knowledge/ReferencesEditor";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Shared Module Detail View (Template B). Read mode by default; edit=true
// shows the structured-field-free MVP edit form (title/status/body/tags).
// Full block editor, version-history UI, and typed relationships are
// intentionally out of scope for this first pass, across every module.
export async function EntryDetailFormPage({
  libraryKey,
  id,
  basePath,
  edit,
}: {
  libraryKey: string;
  id: string;
  basePath: string;
  edit: boolean;
}) {
  const library = await getLibraryByKey(libraryKey);
  if (!library) notFound();

  const entry = await getEntryById(id);
  if (!entry || entry.library_id !== library.id) notFound();

  const [tags, references] = await Promise.all([
    getTagsForEntry(entry.id),
    getReferencesForEntry(entry.id),
  ]);

  if (edit) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href={`${basePath}/${library.key}/${entry.id}`}
          className="text-sm text-muted hover:text-accent"
        >
          ← Cancel
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
          Edit entry
        </h1>

        <form action={updateEntryAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="basePath" value={basePath} />
          <input type="hidden" name="id" value={entry.id} />
          <input type="hidden" name="libraryKey" value={library.key} />

          <div>
            <label className="text-sm font-medium text-foreground">
              Title
            </label>
            <input
              name="title"
              required
              defaultValue={entry.title}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Entry type
            </label>
            <p className="mt-1 text-sm text-muted">{entry.entry_type.name}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Status
            </label>
            <select
              name="status"
              defaultValue={entry.status}
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
              rows={14}
              defaultValue={entry.body}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>

          <ReferencesEditor
            initial={references.map((r) => ({
              label: r.label,
              url: r.url ?? "",
            }))}
          />

          <div>
            <label className="text-sm font-medium text-foreground">
              Tags (comma separated)
            </label>
            <input
              name="tags"
              defaultValue={tags.map((t) => t.name).join(", ")}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div className="mt-2 flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Save changes
            </button>
            <Link
              href={`${basePath}/${library.key}/${entry.id}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`${basePath}/${library.key}`}
        className="text-sm text-muted hover:text-accent"
      >
        ← {library.name}
      </Link>

      <div className="mt-1 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {entry.title}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {entry.entry_type.name} · {entry.status} · updated{" "}
            {formatDateTime(entry.updated_at)}
            {entry.owner_email ? ` · ${entry.owner_email}` : ""}
          </p>
        </div>
        <Link
          href={`${basePath}/${library.key}/${entry.id}?edit=1`}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
        >
          Edit
        </Link>
      </div>

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t.id}
              className="rounded-full bg-accent-soft/30 px-2.5 py-0.5 text-xs font-medium text-accent"
            >
              {t.name}
            </span>
          ))}
        </div>
      )}

      {references.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Linked documents
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {references.map((r) => (
              <li key={r.id}>
                <a
                  href={r.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  {r.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 whitespace-pre-wrap rounded-xl border border-border bg-surface p-5 text-sm text-foreground">
        {entry.body || <span className="text-muted">No content yet.</span>}
      </div>
    </div>
  );
}
