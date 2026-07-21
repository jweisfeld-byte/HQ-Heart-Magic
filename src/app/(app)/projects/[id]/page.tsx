import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/projects/queries";
import { getTasksForProject } from "@/lib/tasks/queries";
import { updateProjectAction } from "@/app/(app)/projects/actions";
import { ProjectPyramid } from "@/components/projects/ProjectPyramid";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { listWorkspaceUsers } from "@/lib/settings/queries";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/tasks/queries";
import { nameFromEmail } from "@/lib/format";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;

  const project = await getProjectById(id);
  if (!project) notFound();

  if (edit) {
    const users = await listWorkspaceUsers();

    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-muted hover:text-accent"
        >
          ← Cancel
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
          Edit project
        </h1>

        <form action={updateProjectAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="id" value={project.id} />

          <div>
            <label className="text-sm font-medium text-foreground">
              Project name
            </label>
            <input
              name="name"
              required
              defaultValue={project.name}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              defaultValue={project.description}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Assigned to
            </label>
            {users && users.length > 0 ? (
              <div className="mt-1 flex flex-col gap-1.5 rounded-lg border border-border bg-surface p-3">
                {users.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      name="assigneeEmails"
                      value={u.email}
                      defaultChecked={project.assignee_emails.includes(u.email)}
                      className="h-4 w-4 accent-accent"
                    />
                    {u.email}
                  </label>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted">
                No workspace users found yet.
              </p>
            )}
          </div>

          <div className="mt-2 flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Save changes
            </button>
            <Link
              href={`/projects/${project.id}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    );
  }

  const tasks = (await getTasksForProject(project.id)) ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/projects" className="text-sm text-muted hover:text-accent">
        ← Projects
      </Link>

      <div className="mt-1 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-1 max-w-xl text-sm text-muted">
              {project.description}
            </p>
          )}
          {project.assignee_emails.length > 0 && (
            <p className="mt-2 text-xs text-muted">
              Assigned to{" "}
              {project.assignee_emails.map(nameFromEmail).join(", ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/tasks/new?project=${project.id}`}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Add task
          </Link>
          <Link
            href={`/projects/${project.id}?edit=1`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
          >
            Edit
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Progress
          </p>
          <p className="text-xs text-muted">
            {tasks.reduce((sum, t) => sum + (t.project_percent ?? 0), 0)}% assigned
          </p>
        </div>
        <div className="mt-3 flex justify-center">
          <ProjectPyramid tasks={tasks} />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Tasks
        </p>
        {tasks.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No tasks in this project yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
              >
                <Link
                  href={`/tasks/${task.id}`}
                  className="truncate text-sm font-medium text-foreground hover:text-accent"
                >
                  {task.title}
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {task.assignee_email && (
                    <span className="text-xs text-muted">
                      {nameFromEmail(task.assignee_email)}
                    </span>
                  )}
                  {task.project_percent !== null && (
                    <span className="text-xs font-medium text-muted">
                      {task.project_percent}%
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[task.status]}`}
                  >
                    {STATUS_LABELS[task.status]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Timeline
        </p>
        <div className="mt-4">
          <ProjectTimeline tasks={tasks} />
        </div>
      </div>
    </div>
  );
}
