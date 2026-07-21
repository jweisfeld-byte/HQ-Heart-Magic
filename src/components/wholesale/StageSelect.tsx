"use client";

import { STAGES, STAGE_LABELS, type Stage } from "@/lib/wholesale/queries";

// Auto-submits on change — no drag-and-drop kanban here, just a fast
// dropdown per card. Needs to be a Client Component for the onChange
// handler; the actual mutation is the server action passed in as a prop.
export function StageSelect({
  id,
  stage,
  action,
  onCard = false,
}: {
  id: string;
  stage: Stage;
  action: (formData: FormData) => void;
  onCard?: boolean;
}) {
  return (
    <form
      action={action}
      className="inline"
      onClick={(e) => e.stopPropagation()}
    >
      <input type="hidden" name="id" value={id} />
      <select
        name="stage"
        defaultValue={stage}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`rounded-lg border border-border px-2 py-1 text-sm text-foreground ${
          onCard ? "bg-surface" : "bg-background"
        }`}
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
