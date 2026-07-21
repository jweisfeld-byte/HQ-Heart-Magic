import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTaskById,
  STATUSES,
  STATUS_LABELS,
  STATUS_STYLES,
  RECURRENCES,
  RECURRENCE_LABELS,
} from "@/lib/tasks/queries";
import { updateTaskAction } from "@/app/(app)/tasks/actions";
import { listWorkspaceUsers } from "@/lib/settings/queries";
import { getProjects, getProjectById } from "@/lib/projects/queries";
import { nameFromEmail } from "@/lib/format";

function formatDate(iso: string | null) {
  if (!iso) return null;
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

export default async function TaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;

  const task = await getTaskById(id);
  if (!task) notFound();

  if (edit) {
    const [users, projects] = await Promise.all([
      listWorkspaceUsers(),
      getProjects(),
    ]);

    return (
      <div className="mx-auto max-w-2xl">
        <Link href={`/tasks/${task.id}`} className="text-sm text-muted hover:text-accent">
          ← Cancel
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
          Edit task
        </h1>

        <form action={updateTaskAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="id" value={task.id} />

          <div>
            <label className="text-sm font-medium text-foreground">
              Task name
            </label>
            <input
              name="title"
              required
              defaultValue={task.title}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                name="status"
                defaultValue={task.status}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Due date
              </label>
              <input
                name="dueDate"
                type="date"
                defaultValue={task.due_date ?? ""}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Assignee
            </label>
            {users && users.length > 0 ? (
              <select
                name="assigneeEmail"
                defaultValue={task.assignee_email ?? ""}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.email}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name="assigneeEmail"
                type="email"
                defaultValue={task.assignee_email ?? ""}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Project
              </label>
              <select
                name="projectId"
                defaultValue={task.project_id ?? ""}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                <option value="">No project</option>
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                % of project
              </label>
              <input
                name="projectPercent"
                type="number"
                min={0}
                max={100}
                step="0.1"
                defaultValue={task.project_percent ?? ""}
                placeholder="e.g. 20"
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Repeats
            </label>
            <select
              name="recurrence"
              defaultValue={task.recurrence ?? ""}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            >
              <option value="">Does not repeat</option>
              {RECURRENCES.map((r) => (
                <option key={r} value={r}>
                  {RECURRENCE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              name="description"
              rows={5}
              defaultValue={task.description}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div className="mt-2 flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Save changes
            </button>
            <Link
              href={`/tasks/${task.id}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    );
  }

  const overdue = isOverdue(task.due_date, task.status);
  const dueDate = formatDate(task.due_date);
  const project = task.project_id ? await getProjectById(task.project_id) : null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/tasks" className="text-sm text-muted hover:text-accent">
        ← Tasks
      </Link>

      <div className="mt-1 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {task.title}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[task.status]}`}
            >
              {STATUS_LABELS[task.status]}
            </span>
            {task.assignee_email && (
              <span className="text-sm text-muted">
                {nameFromEmail(task.assignee_email)}
              </span>
            )}
            {project && (
              <Link
                href={`/projects/${project.id}`}
                className="text-sm text-muted hover:text-accent"
              >
                {project.name}
              </Link>
            )}
            {task.recurrence && (
              <span className="rounded-full bg-accent-soft/30 px-2.5 py-0.5 text-xs font-medium text-accent">
                🔁 {RECURRENCE_LABELS[task.recurrence]}
              </span>
            )}
          </div>
        </div>
        <Link
          href={`/tasks/${task.id}?edit=1`}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
        >
          Edit
        </Link>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Due date
        </p>
        {dueDate ? (
          <p
            className={`mt-1 text-sm font-medium ${
              overdue ? "text-red-600" : "text-foreground"
            }`}
          >
            {overdue ? "Overdue: " : ""}
            {dueDate}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">Not scheduled</p>
        )}
      </div>

      {task.description && (
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-border bg-surface p-4 text-sm text-foreground">
          {task.description}
        </div>
      )}
    </div>
  );
}
