"use client";

// Confirm-guarded delete — a plain submit button without this would let
// one misclick permanently remove an entry (and its whole history/tags/
// linked docs, via cascade). Needs to be a Client Component only for the
// window.confirm() gate; the actual delete is the server action passed
// in as a prop.
export function DeleteEntryButton({
  id,
  basePath,
  libraryKey,
  flat,
  action,
  title,
}: {
  id: string;
  basePath: string;
  libraryKey: string;
  flat: boolean;
  action: (formData: FormData) => void;
  title: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            `Delete "${title}"? This can't be undone — it removes the entry, its history, tags, and linked documents.`,
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="basePath" value={basePath} />
      <input type="hidden" name="libraryKey" value={libraryKey} />
      {flat && <input type="hidden" name="flat" value="1" />}
      <button
        type="submit"
        className="rounded-lg border border-red-900/40 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-950/10"
      >
        Delete
      </button>
    </form>
  );
}
