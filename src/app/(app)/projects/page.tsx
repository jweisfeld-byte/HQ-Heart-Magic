import Link from "next/link";
import { getProjects, getAllProjectTasks } from "@/lib/projects/queries";
import { ProjectPyramid } from "@/components/projects/ProjectPyramid";
import type { TaskStatus } from "@/lib/tasks/queries";

export default async function ProjectsPage() {
  const [projects, allTasks] = await Promise.all([
    getProjects(),
    getAllProjectTasks(),
  ]);

  if (!projects) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Projects
        </h1>
        <div className="mt-6 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          Not set up yet. Run{" "}
          <code className="text-xs">supabase/projects_schema.sql</code> in
          the Supabase SQL Editor to create the projects table.
        </div>
      </div>
    );
  }

  const tasksByProject = new Map<string, { status: TaskStatus }[]>();
  for (const t of allTasks ?? []) {
    if (!t.project_id) continue;
    const list = tasksByProject.get(t.project_id) ?? [];
    list.push({ status: t.status as TaskStatus });
    tasksByProject.set(t.project_id, list);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Projects
        </h1>
        <Link
          href="/projects/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          No projects yet. Create one to see its pyramid fill in as
          tasks get done.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((project) => {
            const tasks = tasksByProject.get(project.id) ?? [];
            const done = tasks.filter((t) => t.status === "done").length;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="rounded-xl border border-border bg-surface p-4 hover:border-accent"
              >
                <p className="font-medium text-foreground">{project.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {tasks.length === 0
                    ? "No tasks yet"
                    : `${done} of ${tasks.length} task${tasks.length === 1 ? "" : "s"} done`}
                </p>
                <div className="mt-3">
                  <ProjectPyramid
                    tasks={tasks.map((t, i) => ({
                      id: String(i),
                      title: "",
                      status: t.status,
                    }))}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
