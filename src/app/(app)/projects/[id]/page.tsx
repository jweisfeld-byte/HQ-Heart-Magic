import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/projects/queries";
import { getTasksForProject } from "@/lib/tasks/queries";
import { updateProjectAction } from "@/app/(app)/projects/actions";
import { ProjectPyramid } from "@/components/projects/ProjectPyramid";
import { ProjectTimeline } from "@/components/projects/ProjectTimeline";
import { listWorkspaceUsers } from "@/lib/settings/queries";
import { nameFromEmail } from "@/lib/format";
import { TaskBoard } from "@/components/tasks/TaskBoard";

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
              <select
                name="assigneeEmails"
                multiple
                size={Math.min(6, users.length)}
                defaultValue={project.assignee_emails}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.email}
                  </option>
                ))}
              </select>
            ) : (
              <p className="mt-1 text-xs text-muted">
                No workspace users found yet.
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              Cmd/Ctrl-click to select more than one.
            </p>
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

      <div className="mt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Tasks
        </p>
        <div className="mt-3">
          <TaskBoard tasks={tasks} />
        </div>
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
