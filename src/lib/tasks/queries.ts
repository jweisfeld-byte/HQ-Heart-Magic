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

export const RECURRENCES = ["daily", "weekly", "monthly", "yearly"] as const;

export type Recurrence = (typeof RECURRENCES)[number];

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

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
  project_id: string | null;
  project_percent: number | null;
  recurrence: Recurrence | null;
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
  projectId: string | null;
  projectPercent: number | null;
  recurrence: Recurrence | null;
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
        project_id: input.projectId,
        project_percent: input.projectId ? input.projectPercent : null,
        recurrence: input.recurrence,
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
    projectId: string | null;
    projectPercent: number | null;
    recurrence: Recurrence | null;
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
        project_id: input.projectId,
        project_percent: input.projectId ? input.projectPercent : null,
        recurrence: input.recurrence,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

function addInterval(dateStr: string, recurrence: Recurrence): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (recurrence === "daily") {
    d.setDate(d.getDate() + 1);
  } else if (recurrence === "weekly") {
    d.setDate(d.getDate() + 7);
  } else if (recurrence === "monthly") {
    d.setMonth(d.getMonth() + 1);
  } else {
    d.setFullYear(d.getFullYear() + 1);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Marking a recurring task done spawns its next occurrence (same title/
// description/assignee/project/percent/recurrence, status reset to
// not_started, due date pushed a week or month out) — the completed row
// stays done as history, matching how Todoist/Things handle repeats,
// and keeping every previously-done occurrence intact for the pyramid.
export async function setTaskStatus(
  id: string,
  status: TaskStatus,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();

    let current: Task | null = null;
    if (status === "done") {
      current = await getTaskById(id);
    }

    const { error } = await supabase
      .from("task")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { error: error.message };

    if (status === "done" && current && current.recurrence) {
      const baseDate = current.due_date ?? new Date().toISOString().slice(0, 10);
      await supabase.from("task").insert({
        title: current.title,
        description: current.description,
        status: "not_started",
        assignee_email: current.assignee_email,
        due_date: addInterval(baseDate, current.recurrence),
        project_id: current.project_id,
        project_percent: current.project_percent,
        recurrence: current.recurrence,
        created_by: current.created_by,
      });
    }

    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function setTaskRecurrence(
  id: string,
  recurrence: Recurrence | null,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("task")
      .update({ recurrence, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function setTaskAssignee(
  id: string,
  assigneeEmail: string | null,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("task")
      .update({ assignee_email: assigneeEmail, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function setTaskDueDate(
  id: string,
  dueDate: string | null,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("task")
      .update({ due_date: dueDate, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function getTasksForProject(
  projectId: string,
): Promise<Task[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("task")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) return null;
    return data as Task[];
  } catch {
    return null;
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
