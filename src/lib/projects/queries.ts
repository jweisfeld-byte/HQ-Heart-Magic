import { createAdminClient } from "@/lib/supabase/admin";
import type { Task } from "@/lib/tasks/queries";

/**
 * Same fail-gracefully convention as the rest of the app: every query
 * here returns null/[] rather than throwing so pages render an honest
 * "not set up yet" state if supabase/projects_schema.sql hasn't been
 * run yet.
 */

export type Project = {
  id: string;
  name: string;
  description: string;
  assignee_emails: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export async function getProjects(): Promise<Project[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("project")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return null;
    return data as Project[];
  } catch {
    return null;
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("project")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data as Project;
  } catch {
    return null;
  }
}

export async function createProject(input: {
  name: string;
  description: string;
  assigneeEmails: string[];
  createdBy: string | null;
}): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("project")
      .insert({
        name: input.name,
        description: input.description,
        assignee_emails: input.assigneeEmails,
        created_by: input.createdBy,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: error?.message ?? "Failed to create project." };
    }
    return { id: data.id as string };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function updateProject(
  id: string,
  input: { name: string; description: string; assigneeEmails: string[] },
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("project")
      .update({
        name: input.name,
        description: input.description,
        assignee_emails: input.assigneeEmails,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

// Every task currently attached to any project, in one query — lets
// the Projects hub compute each pyramid's progress without an N+1
// query per project card.
export async function getAllProjectTasks(): Promise<
  Pick<Task, "id" | "project_id" | "status" | "project_percent">[] | null
> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("task")
      .select("id, project_id, status, project_percent")
      .not("project_id", "is", null);

    if (error) return null;
    return data as Pick<
      Task,
      "id" | "project_id" | "status" | "project_percent"
    >[];
  } catch {
    return null;
  }
}
