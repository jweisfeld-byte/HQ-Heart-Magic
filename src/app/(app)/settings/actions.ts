"use server";

import { revalidatePath } from "next/cache";
import {
  setUserRole,
  updateOrganizationSettings,
  type UserRole,
} from "@/lib/settings/queries";

export async function updateOrganizationAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const defaultCurrency = String(formData.get("defaultCurrency") ?? "USD").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();

  if (!id || !name) {
    throw new Error("Organization name is required.");
  }

  const result = await updateOrganizationSettings({
    id,
    name,
    defaultCurrency,
    timezone,
  });

  if ("error" in result) {
    throw new Error(result.error);
  }

  revalidatePath("/settings/organization");
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
