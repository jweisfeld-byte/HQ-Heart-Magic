"use client";

import { RECURRENCES, RECURRENCE_LABELS, type Recurrence } from "@/lib/tasks/queries";

// Auto-submits on change — inline "Repeat" dropdown for the task board
// (mirrors StatusSelect): none, daily, weekly, monthly, yearly.
export function RecurrenceSelect({
  id,
  recurrence,
  action,
}: {
  id: string;
  recurrence: Recurrence | null;
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
        name="recurrence"
        defaultValue={recurrence ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border-0 bg-transparent px-1 py-0.5 text-sm text-muted hover:bg-accent/5"
      >
        <option value="">Does not repeat</option>
        {RECURRENCES.map((r) => (
          <option key={r} value={r}>
            {RECURRENCE_LABELS[r]}
          </option>
        ))}
      </select>
    </form>
  );
}
