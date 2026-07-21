"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createTask,
  setTaskStatus,
  updateTask,
  STATUSES,
  type TaskStatus,
} from "@/lib/tasks/queries";

function isStatus(value: string): value is TaskStatus {
  return (STATUSES as readonly string[]).includes(value);
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
    createdBy: user?.email ?? null,
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/tasks");
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
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${id}`);
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
}
