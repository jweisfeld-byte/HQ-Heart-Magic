import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteEntryAction, updateEntryAction } from "@/lib/knowledge/actions";
import {
  getEntryById,
  getLibraryByKey,
  getReferencesForEntry,
  getTagsForEntry,
} from "@/lib/knowledge/queries";
import { ReferencesEditor } from "@/components/knowledge/ReferencesEditor";
import { DeleteEntryButton } from "@/components/knowledge/DeleteEntryButton";
import type { FieldSchemaField } from "@/lib/knowledge/types";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function hrefForField(type: FieldSchemaField["type"], value: string) {
  if (type === "email") return `mailto:${value}`;
  if (type === "tel") return `tel:${value}`;
  return value;
}

// Picks a representative icon for a linked document's preview tile —
// by file extension first (a .pdf/.docx/.png etc. in the label tells
// us more than the reference's provenance does), falling back to a
// generic icon per target_type (upload/drive_file/url) only when the
// label has no recognizable extension.
function iconForReference(label: string, targetType: string): string {
  const ext = label.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf"].includes(ext)) return "📕";
  if (["doc", "docx"].includes(ext)) return "📘";
  if (["xls", "xlsx", "csv"].includes(ext)) return "📗";
  if (["ppt", "pptx", "key"].includes(ext)) return "📙";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "heic"].includes(ext)) return "🖼️";
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return "🎬";
  if (["mp3", "wav", "m4a"].includes(ext)) return "🎵";
  if (["zip", "rar", "7z"].includes(ext)) return "🗜️";
  if (targetType === "upload") return "📁";
  if (targetType === "drive_file") return "📄";
  return "🔗";
}

// Shared Module Detail View (Template B). Read mode by default; edit=true
// shows the structured-field-free MVP edit form (title/status/body/tags).
// Full block editor, version-history UI, and typed relationships are
// intentionally out of scope for this first pass, across every module.
// `flat` (Creators, Analytics, Experiments) means routes are
// basePath/[id] rather than basePath/[libraryKey]/[id]. `fieldSchema` +
// `photoFieldKey`/`subtitleFieldKey` turn the read view into a profile
// header (photo, name, handle, contact rows) — used by Creator Profile.
export async function EntryDetailFormPage({
  libraryKey,
  id,
  basePath,
  edit,
  flat = false,
  fieldSchema = [],
  photoFieldKey,
  subtitleFieldKey,
}: {
  libraryKey: string;
  id: string;
  basePath: string;
  edit: boolean;
  flat?: boolean;
  fieldSchema?: FieldSchemaField[];
  photoFieldKey?: string;
  subtitleFieldKey?: string;
}) {
  const library = await getLibraryByKey(libraryKey);
  if (!library) notFound();

  const entry = await getEntryById(id);
  if (!entry || entry.library_id !== library.id) notFound();

  const [tags, references] = await Promise.all([
    getTagsForEntry(entry.id),
    getReferencesForEntry(entry.id),
  ]);

  const listHref = flat ? basePath : `${basePath}/${library.key}`;
  const detailHref = `${listHref}/${entry.id}`;

  if (edit) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href={detailHref} className="text-sm text-muted hover:text-accent">
          ← Cancel
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
          Edit entry
        </h1>

        <form action={updateEntryAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="basePath" value={basePath} />
          <input type="hidden" name="id" value={entry.id} />
          <input type="hidden" name="libraryKey" value={library.key} />
          {flat && <input type="hidden" name="flat" value="1" />}

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

          {fieldSchema.length > 0 && (
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Profile details
              </p>
              {fieldSchema.map((f) => (
                <div key={f.key}>
                  <label className="text-sm font-medium text-foreground">
                    {f.label}
                  </label>
                  <input
                    name={`field_${f.key}`}
                    type={f.type}
                    defaultValue={entry.structured_fields[f.key] ?? ""}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
                  />
                </div>
              ))}
            </div>
          )}

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
              driveFileId: r.drive_file_id ?? undefined,
              storagePath: r.storage_path ?? undefined,
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
              href={detailHref}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    );
  }

  const photo = photoFieldKey ? entry.structured_fields[photoFieldKey] : undefined;
  const subtitle = subtitleFieldKey
    ? entry.structured_fields[subtitleFieldKey]
    : undefined;
  const contactFields = fieldSchema.filter(
    (f) =>
      f.key !== photoFieldKey &&
      f.key !== subtitleFieldKey &&
      entry.structured_fields[f.key],
  );

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={listHref} className="text-sm text-muted hover:text-accent">
        ← {library.name}
      </Link>

      <div className="mt-1 flex items-start justify-between">
        <div className="flex items-start gap-4">
          {fieldSchema.length > 0 &&
            (photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={entry.title}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft/30 text-xl font-semibold text-accent">
                {entry.title.trim().charAt(0).toUpperCase() || "?"}
              </div>
            ))}
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              {entry.title}
            </h1>
            {subtitle && <p className="text-sm text-accent">{subtitle}</p>}
            <p className="mt-1 text-sm text-muted">
              {entry.entry_type.name} · {entry.status} · updated{" "}
              {formatDateTime(entry.updated_at)}
              {entry.owner_email ? ` · ${entry.owner_email}` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`${detailHref}?edit=1`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
          >
            Edit
          </Link>
          <DeleteEntryButton
            id={entry.id}
            basePath={basePath}
            libraryKey={library.key}
            flat={flat}
            action={deleteEntryAction}
            title={entry.title}
          />
        </div>
      </div>

      {contactFields.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Contact
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {contactFields.map((f) => {
              const value = entry.structured_fields[f.key];
              return (
                <li key={f.key} className="text-sm">
                  <span className="text-muted">{f.label}: </span>
                  {f.type === "text" ? (
                    <span className="text-foreground">{value}</span>
                  ) : (
                    <a
                      href={hrefForField(f.type, value)}
                      target={f.type === "url" ? "_blank" : undefined}
                      rel={f.type === "url" ? "noreferrer" : undefined}
                      className="text-accent hover:underline"
                    >
                      {value}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
          <div className="mt-3 flex flex-wrap gap-3">
            {references.map((r) => (
              <a
                key={r.id}
                href={r.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                title={r.label}
                className="group flex w-36 flex-col items-center gap-2 rounded-xl border border-border bg-background p-4 text-center transition hover:border-accent hover:bg-accent/5"
              >
                <span className="text-4xl" aria-hidden>
                  {iconForReference(r.label, r.target_type)}
                </span>
                <span className="line-clamp-2 text-xs font-medium text-foreground group-hover:text-accent">
                  {r.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 whitespace-pre-wrap rounded-xl border border-border bg-surface p-5 text-sm text-foreground">
        {entry.body || <span className="text-muted">No content yet.</span>}
      </div>
    </div>
  );
}
