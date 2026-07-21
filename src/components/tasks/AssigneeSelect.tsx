"use client";

// Auto-submits on change — inline assignee dropdown for the task board
// (mirrors StatusSelect), so a task can be reassigned right from the
// table instead of opening the task.
export function AssigneeSelect({
  id,
  assigneeEmail,
  users,
  action,
}: {
  id: string;
  assigneeEmail: string | null;
  users: { id: string; email: string }[];
  action: (formData: FormData) => void;
}) {
  return (
    <form
      action={action}
      className="inline"
      onClick={(e) => e.stopPropagation()}
    >
      <input type="hidden" name="id" value={id} />
      <select
        name="assigneeEmail"
        defaultValue={assigneeEmail ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border-0 bg-transparent px-1 py-0.5 text-sm text-muted hover:bg-accent/5"
      >
        <option value="">Unassigned</option>
        {users.map((u) => (
          <option key={u.id} value={u.email}>
            {u.email}
          </option>
        ))}
      </select>
    </form>
  );
}
