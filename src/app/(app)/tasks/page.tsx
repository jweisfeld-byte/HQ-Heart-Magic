import Link from "next/link";
import { getTasks } from "@/lib/tasks/queries";
import { TaskBoard } from "@/components/tasks/TaskBoard";

// Monday.com-style board: grouped by month (due date), each group a
// colored section — same "fast dropdown, not delightful" discipline as
// the rest of the app, just laid out like a Monday campaign tracker
// instead of grouped by status. The actual board rendering lives in
// TaskBoard so the dashboard's "Today's tasks" card can reuse it verbatim.
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

      <div className="mt-6">
        <TaskBoard tasks={tasks} />
      </div>
    </div>
  );
}
