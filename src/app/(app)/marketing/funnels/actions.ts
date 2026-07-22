"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createFunnel,
  updateFunnel,
  deleteFunnel,
  addFunnelStage,
  renameFunnelStage,
  setFunnelStageFile,
  deleteFunnelStage,
} from "@/lib/funnels/queries";

export async function createFunnelAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("A funnel name is required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const stageNames = formData.getAll("stageName").map(String);

  const result = await createFunnel({
    name,
    description: String(formData.get("description") ?? ""),
    stageNames,
    createdBy: user?.email ?? null,
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/marketing/funnels");
  redirect(`/marketing/funnels/${result.id}`);
}

export async function updateFunnelAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) {
    throw new Error("A funnel name is required.");
  }

  const result = await updateFunnel(id, {
    name,
    description: String(formData.get("description") ?? ""),
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/marketing/funnels");
  revalidatePath(`/marketing/funnels/${id}`);
}

export async function deleteFunnelAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    throw new Error("A funnel id is required.");
  }

  const result = await deleteFunnel(id);
  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/marketing/funnels");
  redirect("/marketing/funnels");
}

export async function addStageAction(formData: FormData) {
  const funnelId = String(formData.get("funnelId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!funnelId || !name) {
    throw new Error("A stage name is required.");
  }

  const result = await addFunnelStage(funnelId, name);
  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath(`/marketing/funnels/${funnelId}`);
}

export async function renameStageAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const funnelId = String(formData.get("funnelId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) {
    throw new Error("A stage name is required.");
  }

  const result = await renameFunnelStage(id, name);
  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath(`/marketing/funnels/${funnelId}`);
}

export async function setStageFileAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const funnelId = String(formData.get("funnelId") ?? "");
  if (!id) {
    throw new Error("A stage id is required.");
  }

  const result = await setFunnelStageFile(id, {
    fileLabel: String(formData.get("fileLabel") ?? "").trim() || null,
    fileUrl: String(formData.get("fileUrl") ?? "").trim() || null,
    driveFileId: String(formData.get("driveFileId") ?? "").trim() || null,
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath(`/marketing/funnels/${funnelId}`);
}

export async function removeStageFileAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const funnelId = String(formData.get("funnelId") ?? "");
  if (!id) {
    throw new Error("A stage id is required.");
  }

  const result = await setFunnelStageFile(id, {
    fileLabel: null,
    fileUrl: null,
    driveFileId: null,
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath(`/marketing/funnels/${funnelId}`);
}

export async function deleteStageAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const funnelId = String(formData.get("funnelId") ?? "");
  if (!id) {
    throw new Error("A stage id is required.");
  }

  const result = await deleteFunnelStage(id);
  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath(`/marketing/funnels/${funnelId}`);
}
