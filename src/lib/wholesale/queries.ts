import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Every query here fails gracefully (returns null/[] rather than
 * throwing) so pages render an honest "not set up yet" state if
 * supabase/wholesale_schema.sql hasn't been run — same convention used
 * everywhere else in this app.
 */

export const STAGES = [
  "lead",
  "sample_sent",
  "negotiating",
  "active",
  "churned",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  lead: "Lead",
  sample_sent: "Sample Sent",
  negotiating: "Negotiating",
  active: "Active",
  churned: "Churned",
};

export type WholesaleAccount = {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  stage: Stage;
  owner_email: string | null;
  next_follow_up_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export async function getWholesaleAccounts(): Promise<WholesaleAccount[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("wholesale_account")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) return null;
    return data as WholesaleAccount[];
  } catch {
    return null;
  }
}

export async function getWholesaleAccountById(
  id: string,
): Promise<WholesaleAccount | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("wholesale_account")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data as WholesaleAccount;
  } catch {
    return null;
  }
}

export async function createWholesaleAccount(input: {
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  stage: Stage;
  ownerEmail: string | null;
  nextFollowUpAt: string | null;
  notes: string;
}): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("wholesale_account")
      .insert({
        company_name: input.companyName,
        contact_name: input.contactName,
        contact_email: input.contactEmail,
        contact_phone: input.contactPhone,
        address: input.address,
        stage: input.stage,
        owner_email: input.ownerEmail,
        next_follow_up_at: input.nextFollowUpAt,
        notes: input.notes,
      })
      .select("id")
      .single();

    if (error || !data) {
      return { error: error?.message ?? "Failed to create account." };
    }
    return { id: data.id as string };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function updateWholesaleAccount(
  id: string,
  input: {
    companyName: string;
    contactName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    address: string | null;
    stage: Stage;
    ownerEmail: string | null;
    nextFollowUpAt: string | null;
    notes: string;
  },
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("wholesale_account")
      .update({
        company_name: input.companyName,
        contact_name: input.contactName,
        contact_email: input.contactEmail,
        contact_phone: input.contactPhone,
        address: input.address,
        stage: input.stage,
        owner_email: input.ownerEmail,
        next_follow_up_at: input.nextFollowUpAt,
        notes: input.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function setWholesaleAccountStage(
  id: string,
  stage: Stage,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("wholesale_account")
      .update({ stage, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export type WholesaleActivity = {
  id: string;
  account_id: string;
  note: string;
  logged_by: string | null;
  created_at: string;
};

export async function getActivityForAccount(
  accountId: string,
): Promise<WholesaleActivity[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("wholesale_activity")
      .select("*")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as WholesaleActivity[];
  } catch {
    return [];
  }
}

export async function logActivity(
  accountId: string,
  note: string,
  loggedBy: string | null,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("wholesale_activity").insert({
      account_id: accountId,
      note,
      logged_by: loggedBy,
    });

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}
