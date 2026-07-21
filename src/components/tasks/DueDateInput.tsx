"use client";

// Auto-submits on change — the due date shown as plain-looking text
// that's actually a real date input, so it's clickable to change right
// from the task board without opening the task (Jacob's ask).
export function DueDateInput({
  id,
  dueDate,
  overdue,
  action,
}: {
  id: string;
  dueDate: string | null;
  overdue: boolean;
  action: (formData: FormData) => void;
}) {
  return (
    <form
      action={action}
      className="inline"
      onClick={(e) => e.stopPropagation()}
    >
      <input type="hidden" name="id" value={id} />
      <input
        type="date"
        name="dueDate"
        defaultValue={dueDate ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`cursor-pointer rounded-md border-0 bg-transparent px-1 py-0.5 text-sm hover:bg-accent/5 ${
          overdue ? "font-medium text-red-600" : "text-muted"
        }`}
      />
    </form>
  );
}
