"use client";

import { useState } from "react";
import Link from "next/link";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { STATUS_LABELS, STATUS_STYLES, type Task } from "@/lib/tasks/queries";

// Clickable "Today's tasks" dashboard card — collapsed it's a quick
// preview of what's due today; clicked, it expands into the exact same
// grouped board that's on the Tasks tab (Jacob's ask), so you don't have
// to leave the dashboard to see/manage the full list.
export function TasksPreviewCard({
  tasksDueToday,
  allTasks,
  users = [],
}: {
  tasksDueToday: Task[] | null;
  allTasks: Task[] | null;
  users?: { id: string; email: string }[];
}) {
  const [expanded, setExpanded] = useState(false);
  const connected = tasksDueToday !== null;

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <button
        type="button"
        onClick={() => connected && allTasks && setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 font-medium text-foreground">
          <span
            className={`text-xs text-muted transition-transform ${expanded ? "rotate-90" : ""}`}
            aria-hidden
          >
            ▶
          </span>
          Today&apos;s tasks
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            connected ? "bg-green-100 text-green-700" : "bg-accent-soft/30 text-accent"
          }`}
        >
          {connected ? "Live" : "Not connected yet"}
        </span>
      </button>

      {!connected && (
        <p className="mt-1 text-sm text-muted">
          Waiting on <code className="text-xs">supabase/tasks_schema.sql</code> to be run.
        </p>
      )}

      {connected && !expanded && (
        tasksDueToday!.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-2">
            {tasksDueToday!.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3">
                <Link
                  href={`/tasks/${t.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="truncate text-sm text-foreground hover:text-accent"
                >
                  {t.title}
                </Link>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[t.status]}`}
                >
                  {STATUS_LABELS[t.status]}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-muted">Nothing due today.</p>
        )
      )}

      {connected && expanded && (
        <div className="mt-4">
          <TaskBoard tasks={allTasks ?? []} users={users} />
        </div>
      )}
    </div>
  );
}
