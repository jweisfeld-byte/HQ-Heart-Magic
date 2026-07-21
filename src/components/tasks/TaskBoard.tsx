import Link from "next/link";
import {
  changeTaskStatusAction,
  changeTaskAssigneeAction,
  changeTaskDueDateAction,
  changeTaskRecurrenceAction,
} from "@/app/(app)/tasks/actions";
import { StatusSelect } from "@/components/tasks/StatusSelect";
import { AssigneeSelect } from "@/components/tasks/AssigneeSelect";
import { DueDateInput } from "@/components/tasks/DueDateInput";
import { RecurrenceSelect } from "@/components/tasks/RecurrenceSelect";
import type { Task } from "@/lib/tasks/queries";

// Cycled per group in order — same "colorful group header" look as
// Monday's board grouping (Nov. Campaign in blue, Oct. Campaign in
// purple, etc.), just applied to month groups instead of hand-named
// campaign groups.
const GROUP_ACCENTS = [
  { border: "border-blue-400", text: "text-blue-600" },
  { border: "border-purple-400", text: "text-purple-600" },
  { border: "border-teal-400", text: "text-teal-600" },
  { border: "border-orange-400", text: "text-orange-600" },
  { border: "border-pink-400", text: "text-pink-600" },
];
const UNSCHEDULED_ACCENT = { border: "border-gray-300", text: "text-muted" };

function isOverdue(iso: string | null, status: string) {
  if (!iso || status === "done") return false;
  return new Date(iso) < new Date(new Date().toDateString());
}

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// The Monday.com-style board: grouped by month (due date), each group a
// colored section. Extracted out of /tasks so the exact same board can
// also render inline inside the dashboard's "Today's tasks" card once
// expanded (Jacob's ask), instead of duplicating this logic. `users` is
// passed in (rather than fetched here) so this stays a plain component
// that a Client Component (TasksPreviewCard) can render directly.
export function TaskBoard({
  tasks,
  users = [],
}: {
  tasks: Task[];
  users?: { id: string; email: string }[];
}) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/heart.svg"
          alt=""
          className="mx-auto mb-3 h-12 w-12 opacity-70"
        />
        No tasks yet.{" "}
        <Link href="/tasks/new" className="text-accent hover:underline">
          Add the first one
        </Link>
        .
      </div>
    );
  }

  const groups = new Map<string, Task[]>();
  for (const t of tasks) {
    const key = t.due_date ? monthKey(t.due_date) : "unscheduled";
    const arr = groups.get(key);
    if (arr) arr.push(t);
    else groups.set(key, [t]);
  }

  // Chronological (soonest month first); unscheduled tasks last.
  const orderedKeys = [...groups.keys()].sort((a, b) => {
    if (a === "unscheduled") return 1;
    if (b === "unscheduled") return -1;
    return a.localeCompare(b);
  });

  let colorIndex = 0;

  return (
    <div className="flex flex-col gap-6">
      {orderedKeys.map((key) => {
        const group = groups.get(key)!;
        const accent =
          key === "unscheduled"
            ? UNSCHEDULED_ACCENT
            : GROUP_ACCENTS[colorIndex++ % GROUP_ACCENTS.length];
        const label = key === "unscheduled" ? "No due date" : monthLabel(key);

        return (
          <div key={key} className={`border-l-4 pl-4 ${accent.border}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${accent.text}`}>
              {label} · {group.length}
            </p>
            <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="px-4 py-2 font-medium">Task</th>
                    <th className="px-4 py-2 font-medium">Assignee</th>
                    <th className="px-4 py-2 font-medium">Due date</th>
                    <th className="px-4 py-2 font-medium">Repeat</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {group.map((t) => {
                    const overdue = isOverdue(t.due_date, t.status);
                    return (
                      <tr key={t.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-2 font-medium text-foreground">
                          <Link
                            href={`/tasks/${t.id}`}
                            className="hover:text-accent hover:underline"
                          >
                            {t.title}
                          </Link>
                        </td>
                        <td className="px-4 py-2">
                          <AssigneeSelect
                            id={t.id}
                            assigneeEmail={t.assignee_email}
                            users={users}
                            action={changeTaskAssigneeAction}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <DueDateInput
                            id={t.id}
                            dueDate={t.due_date}
                            overdue={overdue}
                            action={changeTaskDueDateAction}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <RecurrenceSelect
                            id={t.id}
                            recurrence={t.recurrence}
                            action={changeTaskRecurrenceAction}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <StatusSelect
                            id={t.id}
                            status={t.status}
                            action={changeTaskStatusAction}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
