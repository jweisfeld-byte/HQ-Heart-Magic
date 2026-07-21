"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createWholesaleAccount,
  logActivity,
  setWholesaleAccountStage,
  updateWholesaleAccount,
  STAGES,
  type Stage,
} from "@/lib/wholesale/queries";

function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value);
}

export async function createAccountAction(formData: FormData) {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const stage = String(formData.get("stage") ?? "lead");

  if (!companyName || !isStage(stage)) {
    throw new Error("Company name and a valid stage are required.");
  }

  const result = await createWholesaleAccount({
    companyName,
    contactName: String(formData.get("contactName") ?? "").trim() || null,
    contactEmail: String(formData.get("contactEmail") ?? "").trim() || null,
    contactPhone: String(formData.get("contactPhone") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    stage,
    ownerEmail: String(formData.get("ownerEmail") ?? "").trim() || null,
    nextFollowUpAt: String(formData.get("nextFollowUpAt") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? ""),
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/wholesale");
  redirect(`/wholesale/${result.id}`);
}

export async function updateAccountAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const companyName = String(formData.get("companyName") ?? "").trim();
  const stage = String(formData.get("stage") ?? "lead");

  if (!id || !companyName || !isStage(stage)) {
    throw new Error("Company name and a valid stage are required.");
  }

  const result = await updateWholesaleAccount(id, {
    companyName,
    contactName: String(formData.get("contactName") ?? "").trim() || null,
    contactEmail: String(formData.get("contactEmail") ?? "").trim() || null,
    contactPhone: String(formData.get("contactPhone") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    stage,
    ownerEmail: String(formData.get("ownerEmail") ?? "").trim() || null,
    nextFollowUpAt: String(formData.get("nextFollowUpAt") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? ""),
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/wholesale");
  revalidatePath(`/wholesale/${id}`);
  redirect(`/wholesale/${id}`);
}

export async function changeStageAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const stage = String(formData.get("stage") ?? "");

  if (!id || !isStage(stage)) {
    throw new Error("A valid stage is required.");
  }

  const result = await setWholesaleAccountStage(id, stage);
  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/wholesale");
  revalidatePath(`/wholesale/${id}`);
}

export async function logActivityAction(formData: FormData) {
  const accountId = String(formData.get("accountId") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!accountId || !note) {
    throw new Error("A note is required.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await logActivity(accountId, note, user?.email ?? null);
  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath(`/wholesale/${accountId}`);
}
