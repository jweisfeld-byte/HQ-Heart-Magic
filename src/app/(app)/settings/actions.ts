"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  setUserRole,
  updateOrganizationSettings,
  updateUserRainbowGlow,
  uploadUserDashboardBackground,
  resetUserDashboardBackground,
  type UserRole,
} from "@/lib/settings/queries";
import { saveMetaConnection, disconnectMeta } from "@/lib/meta/queries";

// Appearance is personal to whoever is logged in (Jacob's ask) — every
// appearance action reads the CURRENT user's own session rather than
// trusting a hidden form field, so nobody can (even accidentally) edit
// someone else's appearance settings.
async function getCurrentUserEmail(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}

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
  const email = await getCurrentUserEmail();
  const rainbowGlowEnabled = formData.get("rainbowGlowEnabled") === "on";

  if (!email) {
    return;
  }

  const result = await updateUserRainbowGlow(email, rainbowGlowEnabled);

  if ("error" in result) {
    return;
  }

  revalidatePath("/settings/appearance");
  revalidatePath("/", "layout");
}

export async function uploadDashboardBackgroundAction(formData: FormData) {
  const email = await getCurrentUserEmail();
  const file = formData.get("file") as File | null;

  if (!email || !file) {
    return;
  }

  const result = await uploadUserDashboardBackground({ email, file });

  if ("error" in result) {
    return;
  }

  revalidatePath("/settings/appearance");
  revalidatePath("/dashboard");
}

export async function resetDashboardBackgroundAction() {
  const email = await getCurrentUserEmail();

  if (!email) {
    return;
  }

  const result = await resetUserDashboardBackground(email);

  if ("error" in result) {
    return;
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

export async function connectMetaAction(formData: FormData) {
  const adAccountId = String(formData.get("adAccountId") ?? "").trim();
  const accessToken = String(formData.get("accessToken") ?? "").trim();

  if (!adAccountId || !accessToken) {
    return;
  }

  const result = await saveMetaConnection({ adAccountId, accessToken });
  if ("error" in result) {
    return;
  }

  revalidatePath("/settings/integrations");
}

export async function disconnectMetaAction() {
  const result = await disconnectMeta();
  if ("error" in result) {
    return;
  }

  revalidatePath("/settings/integrations");
}
