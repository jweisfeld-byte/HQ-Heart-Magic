import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Every query here fails gracefully (returns null/[] rather than
 * throwing) so pages render an honest "not set up yet" state if
 * supabase/tasks_schema.sql hasn't been run — same convention used
 * everywhere else in this app.
 */

export const STATUSES = [
  "not_started",
  "working_on_it",
  "stuck",
  "done",
] as const;

export type TaskStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: "Not Started",
  working_on_it: "Working on It",
  stuck: "Stuck",
  done: "Done",
};

// Monday.com's classic status colors — the whole point of "mimic
// Monday's layout" is that status is a colored pill/group, not a plain
// table cell.
export const STATUS_STYLES: Record<TaskStatus, string> = {
  not_started: "bg-gray-200 text-gray-700",
  working_on_it: "bg-orange-100 text-orange-700",
  stuck: "bg-red-100 text-red-700",
  done: "bg-green-100 text-green-700",
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignee_email: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function getTasks(): Promise<Task[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("task")
      .select("*")
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) return null;
    return data as Task[];
  } catch {
    return null;
  }
}

export async function getTaskById(id: string): Promise<Task | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("task")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data as Task;
  } catch {
    return null;
  }
}

export async function createTask(input: {
  title: string;
  description: string;
  status: TaskStatus;
  assigneeEmail: string | null;
  dueDate: string | null;
  createdBy: string | null;
}): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("task")
      .insert({
        title: input.title,
        description: input.description,
        status: input.status,
        assignee_email: input.assigneeEmail,
        due_date: input.dueDate,
        created_by: input.createdBy,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: error?.message ?? "Failed to create task." };
    }
    return { id: data.id as string };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function updateTask(
  id: string,
  input: {
    title: string;
    description: string;
    status: TaskStatus;
    assigneeEmail: string | null;
    dueDate: string | null;
  },
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("task")
      .update({
        title: input.title,
        description: input.description,
        status: input.status,
        assignee_email: input.assigneeEmail,
        due_date: input.dueDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function setTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("task")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function getTasksDueToday(): Promise<Task[] | null> {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("task")
      .select("*")
      .eq("due_date", todayStr)
      .order("created_at", { ascending: true });

    if (error) return null;
    return data as Task[];
  } catch {
    return null;
  }
}
