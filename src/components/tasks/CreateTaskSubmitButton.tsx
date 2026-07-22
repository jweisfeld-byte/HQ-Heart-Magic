"use client";

import { useFormStatus } from "react-dom";

// Jacob's report: tasks made from the Events section (and, by the same
// shared /tasks/new form, anywhere else) sometimes come out doubled.
// The create form had a plain submit button with no pending state, so
// a slow response (or an impatient double-click/double-tap) could fire
// the same createTaskAction twice, inserting two identical rows.
// Disabling the button the instant the form starts submitting closes
// that window without needing any other change to the create flow.
export function CreateTaskSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Creating…" : "Create task"}
    </button>
  );
}
