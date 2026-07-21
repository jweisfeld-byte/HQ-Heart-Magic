import Link from "next/link";
import {
  getTasks,
  STATUSES,
  STATUS_LABELS,
  type Task,
} from "@/lib/tasks/queries";
import { changeTaskStatusAction } from "@/app/(app)/tasks/actions";
import { StatusSelect } from "@/components/tasks/StatusSelect";

const GROUP_BAR_STYLES: Record<string, string> = {
  not_started: "border-gray-400",
  working_on_it: "border-orange-400",
  stuck: "border-red-400",
  done: "border-green-400",
};

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

function assigneeLabel(email: string | null) {
  if (!email) return "Unassigned";
  return email.split("@")[0];
}

// Monday.com-style board: grouped by status, each group a colored
// section, each row a task with an inline status pill instead of
// drag-and-drop between groups — same "fast dropdown, not delightful"
// discipline used for Wholesale's pipeline stages.
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

  const byStatus: Record<string, Task[]> = {};
  for (const s of STATUSES) byStatus[s] = [];
  for (const t of tasks) (byStatus[t.status] ??= []).push(t);

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
          No tasks yet.{" "}
          <Link href="/tasks/new" className="text-accent hover:underline">
            Add the first one
          </Link>
          .
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {STATUSES.map((status) => {
            const group = byStatus[status];
            if (group.length === 0) return null;

            return (
              <div
                key={status}
                className={`border-l-4 pl-4 ${GROUP_BAR_STYLES[status]}`}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {STATUS_LABELS[status]} · {group.length}
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
