"use client";

export function DeleteEventButton({
  id,
  title,
  action,
}: {
  id: string;
  title: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete "${title}"? This can't be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-lg border border-red-900/40 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-950/10"
      >
        Delete
      </button>
    </form>
  );
}
