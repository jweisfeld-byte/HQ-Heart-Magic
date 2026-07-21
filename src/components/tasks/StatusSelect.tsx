"use client";

import {
  STATUSES,
  STATUS_LABELS,
  STATUS_STYLES,
  type TaskStatus,
} from "@/lib/tasks/queries";

// Auto-submits on change — the colored-pill status dropdown that makes a
// task board read like Monday.com's. Needs to be a Client Component for
// the onChange handler; the actual mutation is the server action passed
// in as a prop.
export function StatusSelect({
  id,
  status,
  action,
}: {
  id: string;
  status: TaskStatus;
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
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
