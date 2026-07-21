import Link from "next/link";
import { createProjectAction } from "@/app/(app)/projects/actions";
import { listWorkspaceUsers } from "@/lib/settings/queries";

export default async function NewProjectPage() {
  const users = await listWorkspaceUsers();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/projects" className="text-sm text-muted hover:text-accent">
        ← Projects
      </Link>
      <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
        New project
      </h1>

      <form action={createProjectAction} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-foreground">
            Project name
          </label>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="e.g. Fall Wholesale Push"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            name="description"
            rows={4}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="Any context, links, or notes."
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
            Create project
          </button>
          <Link
            href="/projects"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
