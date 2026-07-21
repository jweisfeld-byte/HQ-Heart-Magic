import Link from "next/link";
import { STATUS_LABELS, STATUS_STYLES, type Task } from "@/lib/tasks/queries";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(iso: string | null, status: string) {
  if (!iso || status === "done") return false;
  return new Date(iso) < new Date(new Date().toDateString());
}

// A simple chronological timeline of the project's tasks (Jacob's
// ask) — scheduled tasks in due-date order down the left rail,
// unscheduled ones grouped at the bottom rather than dropped.
export function ProjectTimeline({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-muted">No tasks in this project yet.</p>
    );
  }

  const scheduled = tasks
    .filter((t) => t.due_date)
    .sort((a, b) => (a.due_date as string).localeCompare(b.due_date as string));
  const unscheduled = tasks.filter((t) => !t.due_date);

  return (
    <div className="flex flex-col gap-6">
      {scheduled.length > 0 && (
        <ol className="relative flex flex-col gap-5 border-l border-border pl-5">
          {scheduled.map((task) => {
            const overdue = isOverdue(task.due_date, task.status);
            return (
              <li key={task.id} className="relative">
                <span
                  className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-surface ${
                    task.status === "done"
                      ? "bg-green-500"
                      : overdue
                        ? "bg-red-500"
                        : "bg-accent"
                  }`}
                />
                <p className="text-xs font-medium text-muted">
                  {formatDate(task.due_date as string)}
                  {overdue ? " · overdue" : ""}
                </p>
                <Link
                  href={`/tasks/${task.id}`}
                  className="text-sm font-medium text-foreground hover:text-accent"
                >
                  {task.title}
                </Link>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[task.status]}`}
                >
                  {STATUS_LABELS[task.status]}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {unscheduled.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Unscheduled
          </p>
          <ul className="mt-2 flex flex-col gap-2">
            {unscheduled.map((task) => (
              <li key={task.id} className="flex items-center gap-2 text-sm">
                <Link
                  href={`/tasks/${task.id}`}
                  className="font-medium text-foreground hover:text-accent"
                >
                  {task.title}
                </Link>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[task.status]}`}
                >
                  {STATUS_LABELS[task.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
