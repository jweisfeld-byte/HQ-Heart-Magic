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
  updateFunnelStageStrategy,
  addStageAsset,
  renameStageAsset,
  setStageAssetFile,
  deleteStageAsset,
  updateStageAssetCopy,
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
  const stageStrategies = formData.getAll("stageStrategy").map(String);

  const result = await createFunnel({
    name,
    description: String(formData.get("description") ?? ""),
    stages: stageNames.map((n, i) => ({ name: n, strategy: stageStrategies[i] ?? "" })),
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

  // Same reasoning as addAssetAction: no-op on a blank submit instead
  // of crashing the page.
  if (!funnelId || !name) {
    return;
  }

  const result = await addFunnelStage(funnelId, name);
  if ("error" in result) {
    return;
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

export async function updateStageStrategyAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const funnelId = String(formData.get("funnelId") ?? "");
  const strategy = String(formData.get("strategy") ?? "");
  if (!id) {
    throw new Error("A stage id is required.");
  }

  const result = await updateFunnelStageStrategy(id, strategy);
  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath(`/marketing/funnels/${funnelId}`);
}

export async function addAssetAction(formData: FormData) {
  const stageId = String(formData.get("stageId") ?? "");
  const funnelId = String(formData.get("funnelId") ?? "");
  const label = String(formData.get("label") ?? "").trim();

  // A blank submit (button clicked before typing a label) should just
  // no-op rather than crash the whole page — the input's `required`
  // attribute stops this in normal use, but a stray empty submit
  // shouldn't take the page down either.
  if (!stageId || !label) {
    return;
  }

  const result = await addStageAsset(stageId, label);
  if ("error" in result) {
    return;
  }

  revalidatePath(`/marketing/funnels/${funnelId}`);
}

export async function renameAssetAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const funnelId = String(formData.get("funnelId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  if (!id || !label) {
    throw new Error("A format label is required.");
  }

  const result = await renameStageAsset(id, label);
  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath(`/marketing/funnels/${funnelId}`);
}

export async function setAssetFileAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const funnelId = String(formData.get("funnelId") ?? "");
  if (!id) {
    throw new Error("A format id is required.");
  }

  const result = await setStageAssetFile(id, {
    fileLabel: String(formData.get("fileLabel") ?? "").trim() || null,
    fileUrl: String(formData.get("fileUrl") ?? "").trim() || null,
    driveFileId: String(formData.get("driveFileId") ?? "").trim() || null,
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath(`/marketing/funnels/${funnelId}`);
}

export async function removeAssetFileAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const funnelId = String(formData.get("funnelId") ?? "");
  if (!id) {
    throw new Error("A format id is required.");
  }

  const result = await setStageAssetFile(id, {
    fileLabel: null,
    fileUrl: null,
    driveFileId: null,
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath(`/marketing/funnels/${funnelId}`);
}

export async function deleteAssetAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const funnelId = String(formData.get("funnelId") ?? "");
  if (!id) {
    throw new Error("A format id is required.");
  }

  const result = await deleteStageAsset(id);
  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath(`/marketing/funnels/${funnelId}`);
}

export async function updateAssetCopyAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const funnelId = String(formData.get("funnelId") ?? "");
  const adCopy = String(formData.get("adCopy") ?? "");
  if (!id) {
    return;
  }

  const result = await updateStageAssetCopy(id, adCopy);
  if ("error" in result) {
    return;
  }

  revalidatePath(`/marketing/funnels/${funnelId}`);
}
