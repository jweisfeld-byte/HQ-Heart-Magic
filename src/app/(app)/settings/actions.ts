"use server";

import { revalidatePath } from "next/cache";
import {
  setUserRole,
  updateOrganizationSettings,
  updateDashboardAppearance,
  uploadDashboardBackground,
  resetDashboardBackground,
  type UserRole,
} from "@/lib/settings/queries";

export async function updateOrganizationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const defaultCurrency = String(formData.get("defaultCurrency") ?? "USD").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();
  const teamCalendarUrl = String(formData.get("teamCalendarUrl") ?? "").trim() || null;

  if (!id || !name) {
    throw new Error("Organization name is required.");
  }

  const result = await updateOrganizationSettings({
    id,
    name,
    defaultCurrency,
    timezone,
    teamCalendarUrl,
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/settings/organization");
}

export async function updateRainbowGlowAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const rainbowGlowEnabled = formData.get("rainbowGlowEnabled") === "on";

  if (!id) {
    throw new Error("Missing organization settings id.");
  }

  const result = await updateDashboardAppearance({ id, rainbowGlowEnabled });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/settings/appearance");
  revalidatePath("/", "layout");
}

export async function uploadDashboardBackgroundAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const file = formData.get("file") as File | null;

  if (!id) {
    throw new Error("Missing organization settings id.");
  }
  if (!file) {
    throw new Error("Choose an image file first.");
  }

  const result = await uploadDashboardBackground({ id, file });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/settings/appearance");
  revalidatePath("/dashboard");
}

export async function resetDashboardBackgroundAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("Missing organization settings id.");
  }

  const result = await resetDashboardBackground(id);

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/settings/appearance");
  revalidatePath("/dashboard");
}

const VALID_ROLES: UserRole[] = ["owner", "admin", "member", "guest"];

export async function updateUserRoleAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "member") as UserRole;

  if (!email || !VALID_ROLES.includes(role)) {
    throw new Error("A valid email and role are required.");
  }

  const result = await setUserRole(email, role);

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/settings/roles");
}
