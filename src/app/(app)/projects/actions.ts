"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProject, updateProject } from "@/lib/projects/queries";

export async function createProjectAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Project name is required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await createProject({
    name,
    description: String(formData.get("description") ?? ""),
    createdBy: user?.email ?? null,
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/projects");
  redirect(`/projects/${result.id}`);
}

export async function updateProjectAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!id || !name) {
    throw new Error("Project name is required.");
  }

  const result = await updateProject(id, {
    name,
    description: String(formData.get("description") ?? ""),
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}`);
}
