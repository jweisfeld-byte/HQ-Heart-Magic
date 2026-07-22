import Link from "next/link";
import { createTaskAction } from "@/app/(app)/tasks/actions";
import { CreateTaskSubmitButton } from "@/components/tasks/CreateTaskSubmitButton";
import { STATUSES, STATUS_LABELS, RECURRENCES, RECURRENCE_LABELS } from "@/lib/tasks/queries";
import { listWorkspaceUsers } from "@/lib/settings/queries";
import { getProjects } from "@/lib/projects/queries";
import { getEvents } from "@/lib/events/queries";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; event?: string }>;
}) {
  const { project: preselectedProject, event: preselectedEvent } = await searchParams;
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
        New task
      </h1>

      <form action={createTaskAction} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-foreground">
            Task name
          </label>
          <input
            name="title"
            required
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="e.g. Finalize Q3 launch brief"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              Status
            </label>
            <select
              name="status"
              defaultValue="not_started"
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
              defaultValue=""
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
              placeholder="teammate@heartmagiccacao.com"
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
              defaultValue={preselectedProject ?? ""}
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
            defaultValue={preselectedEvent ?? ""}
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
            defaultValue=""
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
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="Any context, links, or notes."
          />
        </div>

        <div className="mt-2 flex gap-3">
          <CreateTaskSubmitButton />
          <Link
            href="/tasks"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
