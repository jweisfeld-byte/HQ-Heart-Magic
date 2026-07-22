import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTaskById,
  STATUSES,
  STATUS_LABELS,
  RECURRENCES,
  RECURRENCE_LABELS,
} from "@/lib/tasks/queries";
import { updateTaskAction, deleteTaskAction } from "@/app/(app)/tasks/actions";
import { listWorkspaceUsers } from "@/lib/settings/queries";
import { getProjects } from "@/lib/projects/queries";
import { getEvents } from "@/lib/events/queries";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const task = await getTaskById(id);
  if (!task) notFound();

  const [users, projects, events] = await Promise.all([
    listWorkspaceUsers(),
    getProjects(),
    getEvents(),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/tasks" className="text-sm text-muted hover:text-accent">
        ← Tasks
      </Link>
      <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
        {task.title}
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
            Event
          </label>
          <select
            name="eventId"
            defaultValue={task.event_id ?? ""}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
          >
            <option value="">No event</option>
            {(events ?? []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} ({e.event_date})
              </option>
            ))}
          </select>
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
        </div>
      </form>

      <form action={deleteTaskAction} className="mt-8 border-t border-border pt-6">
        <input type="hidden" name="id" value={task.id} />
        <button
          type="submit"
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Delete task
        </button>
      </form>
    </div>
  );
}
