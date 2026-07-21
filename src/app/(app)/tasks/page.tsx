import Link from "next/link";
import { getTasks, type Task } from "@/lib/tasks/queries";
import { changeTaskStatusAction } from "@/app/(app)/tasks/actions";
import { StatusSelect } from "@/components/tasks/StatusSelect";

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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

function assigneeLabel(email: string | null) {
  if (!email) return "Unassigned";
  return email.split("@")[0];
}

// Monday.com-style board: grouped by month (due date), each group a
// colored section — same "fast dropdown, not delightful" discipline as
// the rest of the app, just laid out like a Monday campaign tracker
// instead of grouped by status.
export default async function TasksPage() {
  const tasks = await getTasks();

  if (tasks === null) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          Not set up yet. Run{" "}
          <code className="text-xs">supabase/tasks_schema.sql</code> in the
          Supabase SQL Editor to create the Tasks table.
        </div>
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
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Tasks
          </h1>
          <p className="mt-1 text-sm text-muted">
            One team board — who&apos;s doing what, and by when.
          </p>
        </div>
        <Link
          href="/tasks/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          New task
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
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
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {orderedKeys.map((key) => {
            const group = groups.get(key)!;
            const accent =
              key === "unscheduled"
                ? UNSCHEDULED_ACCENT
                : GROUP_ACCENTS[colorIndex++ % GROUP_ACCENTS.length];
            const label =
              key === "unscheduled" ? "No due date" : monthLabel(key);

            return (
              <div key={key} className={`border-l-4 pl-4 ${accent.border}`}>
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${accent.text}`}
                >
                  {label} · {group.length}
                </p>
                <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted">
                        <th className="px-4 py-2 font-medium">Task</th>
                        <th className="px-4 py-2 font-medium">Assignee</th>
                        <th className="px-4 py-2 font-medium">Due date</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((t) => {
                        const overdue = isOverdue(t.due_date, t.status);
                        return (
                          <tr
                            key={t.id}
                            className="border-b border-border last:border-0"
                          >
                            <td className="px-4 py-2 font-medium text-foreground">
                              <Link
                                href={`/tasks/${t.id}`}
                                className="hover:text-accent hover:underline"
                              >
                                {t.title}
                              </Link>
                            </td>
                            <td className="px-4 py-2 text-muted">
                              {assigneeLabel(t.assignee_email)}
                            </td>
                            <td
                              className={`px-4 py-2 ${
                                overdue
                                  ? "font-medium text-red-600"
                                  : "text-muted"
                              }`}
                            >
                              {t.due_date
                                ? `${overdue ? "Overdue: " : ""}${formatDate(t.due_date)}`
                                : "—"}
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
      )}
    </div>
  );
}
