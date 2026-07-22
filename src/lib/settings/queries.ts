import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Every query here fails gracefully (returns null/[] rather than
 * throwing) so the Settings pages render an honest "not set up yet"
 * state if supabase/settings_schema.sql hasn't been run — same
 * convention used everywhere else in this app.
 */

export type OrganizationSettings = {
  id: string;
  name: string;
  default_currency: string;
  timezone: string;
  rainbow_glow_enabled: boolean;
  dashboard_background_url: string | null;
  team_calendar_url: string | null;
  updated_at: string;
};

export async function getOrganizationSettings(): Promise<OrganizationSettings | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("organization_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as OrganizationSettings;
  } catch {
    return null;
  }
}

export async function updateOrganizationSettings(input: {
  id: string;
  name: string;
  defaultCurrency: string;
  timezone: string;
  teamCalendarUrl: string | null;
}): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("organization_settings")
      .update({
        name: input.name,
        default_currency: input.defaultCurrency,
        timezone: input.timezone,
        team_calendar_url: input.teamCalendarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

// Dashboard Appearance (Settings > Appearance) — Jacob's ask: a toggle
// for the rainbow border-glow effect, and a way to swap the dashboard's
// background photo without touching code.
export async function updateDashboardAppearance(input: {
  id: string;
  rainbowGlowEnabled: boolean;
}): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("organization_settings")
      .update({
        rainbow_glow_enabled: input.rainbowGlowEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

const MAX_BACKGROUND_BYTES = 8 * 1024 * 1024; // 8MB

// Uploads to the public `dashboard-backgrounds` Storage bucket (see
// supabase/dashboard_appearance_schema.sql) and saves the resulting
// public URL onto the organization_settings row.
export async function uploadDashboardBackground(input: {
  id: string;
  file: File;
}): Promise<{ ok: true; url: string } | { error: string }> {
  const { id, file } = input;

  if (!file || file.size === 0) {
    return { error: "Choose an image file first." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "That file isn't an image." };
  }
  if (file.size > MAX_BACKGROUND_BYTES) {
    return { error: "Image is too large (8MB max)." };
  }

  try {
    const supabase = createAdminClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `background-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("dashboard-backgrounds")
      .upload(path, file, { contentType: file.type, upsert: true });

    if (uploadError) return { error: uploadError.message };

    const { data: publicUrlData } = supabase.storage
      .from("dashboard-backgrounds")
      .getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("organization_settings")
      .update({
        dashboard_background_url: publicUrlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) return { error: updateError.message };

    return { ok: true, url: publicUrlData.publicUrl };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function resetDashboardBackground(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("organization_settings")
      .update({
        dashboard_background_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export type WorkspaceUser = {
  id: string;
  email: string;
  lastSignInAt: string | null;
  createdAt: string;
};

// Real Google Workspace users who have actually signed into this app,
// via Supabase Auth's admin API (service-role only) — not a separate
// "people" table that could drift from who can actually log in.
export async function listWorkspaceUsers(): Promise<WorkspaceUser[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error || !data) return null;

    return data.users
      .filter((u) => !!u.email)
      .map((u) => ({
        id: u.id,
        email: u.email as string,
        lastSignInAt: u.last_sign_in_at ?? null,
        createdAt: u.created_at,
      }))
      .sort((a, b) => a.email.localeCompare(b.email));
  } catch {
    return null;
  }
}

export type UserRole = "owner" | "admin" | "member" | "guest";

export async function getUserRoles(): Promise<Record<string, UserRole>> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("user_role").select("*");

    if (error || !data) return {};

    const map: Record<string, UserRole> = {};
    for (const row of data as { email: string; role: UserRole }[]) {
      map[row.email] = row.role;
    }
    return map;
  } catch {
    return {};
  }
}

export async function setUserRole(
  email: string,
  role: UserRole,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("user_role")
      .upsert({ email, role, updated_at: new Date().toISOString() });

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export type ShopifyConnectionSummary = {
  shopDomain: string;
  scope: string | null;
  installedAt: string;
};

// Display-safe summary (no access token) for the Integrations page.
export async function getShopifyConnectionSummary(): Promise<ShopifyConnectionSummary | null> {
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  if (!shopDomain) return null;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("shopify_connection")
      .select("shop_domain, scope, installed_at")
      .eq("shop_domain", shopDomain)
      .maybeSingle();

    if (error || !data) return null;
    return {
      shopDomain: data.shop_domain,
      scope: data.scope,
      installedAt: data.installed_at,
    };
  } catch {
    return null;
  }
}
