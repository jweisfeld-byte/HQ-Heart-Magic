"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createTask,
  setTaskStatus,
  updateTask,
  STATUSES,
  RECURRENCES,
  type TaskStatus,
  type Recurrence,
} from "@/lib/tasks/queries";

function isStatus(value: string): value is TaskStatus {
  return (STATUSES as readonly string[]).includes(value);
}

function parseRecurrence(value: string): Recurrence | null {
  return (RECURRENCES as readonly string[]).includes(value)
    ? (value as Recurrence)
    : null;
}

function parsePercent(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function createTaskAction(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const status = String(formData.get("status") ?? "not_started");

  if (!title || !isStatus(status)) {
    throw new Error("Title and a valid status are required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await createTask({
    title,
    description: String(formData.get("description") ?? ""),
    status,
    assigneeEmail: String(formData.get("assigneeEmail") ?? "").trim() || null,
    dueDate: String(formData.get("dueDate") ?? "").trim() || null,
    projectId: String(formData.get("projectId") ?? "").trim() || null,
    projectPercent: parsePercent(String(formData.get("projectPercent") ?? "")),
    recurrence: parseRecurrence(String(formData.get("recurrence") ?? "")),
    createdBy: user?.email ?? null,
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/tasks");
  revalidatePath("/projects");
  redirect(`/tasks/${result.id}`);
}

export async function updateTaskAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const status = String(formData.get("status") ?? "not_started");

  if (!id || !title || !isStatus(status)) {
    throw new Error("Title and a valid status are required.");
  }

  const result = await updateTask(id, {
    title,
    description: String(formData.get("description") ?? ""),
    status,
    assigneeEmail: String(formData.get("assigneeEmail") ?? "").trim() || null,
    dueDate: String(formData.get("dueDate") ?? "").trim() || null,
    projectId: String(formData.get("projectId") ?? "").trim() || null,
    projectPercent: parsePercent(String(formData.get("projectPercent") ?? "")),
    recurrence: parseRecurrence(String(formData.get("recurrence") ?? "")),
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  revalidatePath("/projects");
  redirect(`/tasks/${id}`);
}

export async function changeTaskStatusAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !isStatus(status)) {
    throw new Error("A valid status is required.");
  }

  const result = await setTaskStatus(id, status);
  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
  revalidatePath("/projects");
}
