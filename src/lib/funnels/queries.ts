import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Every query here fails gracefully (returns null rather than
 * throwing) so pages render an honest "not set up yet" state if
 * supabase/funnels_schema.sql hasn't been run — same convention used
 * everywhere else in this app.
 */

export type Funnel = {
  id: string;
  name: string;
  description: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type FunnelStage = {
  id: string;
  funnel_id: string;
  name: string;
  position: number;
  size_percent: number | null;
  file_label: string | null;
  file_url: string | null;
  drive_file_id: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export async function getFunnels(): Promise<Funnel[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("funnel")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) return null;
    return data as Funnel[];
  } catch {
    return null;
  }
}

export async function getFunnelById(id: string): Promise<Funnel | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("funnel")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return data as Funnel;
  } catch {
    return null;
  }
}

export async function getFunnelStages(
  funnelId: string,
): Promise<FunnelStage[] | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("funnel_stage")
      .select("*")
      .eq("funnel_id", funnelId)
      .order("position", { ascending: true });

    if (error) return null;
    return data as FunnelStage[];
  } catch {
    return null;
  }
}

// Every funnel + its stage count in one round trip, for the hub page's
// cards (mirrors the Projects hub's approach to task counts).
export async function getFunnelStageCounts(
  funnelIds: string[],
): Promise<Record<string, number>> {
  if (funnelIds.length === 0) return {};
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("funnel_stage")
      .select("funnel_id")
      .in("funnel_id", funnelIds);

    if (error || !data) return {};
    const counts: Record<string, number> = {};
    for (const row of data as { funnel_id: string }[]) {
      counts[row.funnel_id] = (counts[row.funnel_id] ?? 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}

export async function createFunnel(input: {
  name: string;
  description: string;
  stageNames: string[];
  createdBy: string | null;
}): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { data: funnel, error: funnelError } = await supabase
      .from("funnel")
      .insert({
        name: input.name,
        description: input.description,
        created_by: input.createdBy,
      })
      .select("id")
      .single();

    if (funnelError || !funnel) {
      return { error: funnelError?.message ?? "Could not create funnel." };
    }

    const stageNames = input.stageNames.filter((n) => n.trim());
    if (stageNames.length > 0) {
      const { error: stagesError } = await supabase.from("funnel_stage").insert(
        stageNames.map((name, i) => ({
          funnel_id: funnel.id,
          name: name.trim(),
          position: i,
        })),
      );
      if (stagesError) {
        return { error: stagesError.message };
      }
    }

    return { id: funnel.id as string };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not create funnel.",
    };
  }
}

export async function updateFunnel(
  id: string,
  input: { name: string; description: string },
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("funnel")
      .update({
        name: input.name,
        description: input.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not update funnel.",
    };
  }
}

export async function deleteFunnel(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("funnel").delete().eq("id", id);
    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not delete funnel.",
    };
  }
}

export async function addFunnelStage(
  funnelId: string,
  name: string,
): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { data: existing, error: countError } = await supabase
      .from("funnel_stage")
      .select("position")
      .eq("funnel_id", funnelId)
      .order("position", { ascending: false })
      .limit(1);

    if (countError) return { error: countError.message };
    const nextPosition = (existing?.[0]?.position ?? -1) + 1;

    const { data, error } = await supabase
      .from("funnel_stage")
      .insert({ funnel_id: funnelId, name, position: nextPosition })
      .select("id")
      .single();

    if (error || !data) {
      return { error: error?.message ?? "Could not add stage." };
    }
    return { id: data.id as string };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not add stage.",
    };
  }
}

export async function renameFunnelStage(
  id: string,
  name: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("funnel_stage")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not rename stage.",
    };
  }
}

export async function setFunnelStageFile(
  id: string,
  input: {
    fileLabel: string | null;
    fileUrl: string | null;
    driveFileId: string | null;
  },
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("funnel_stage")
      .update({
        file_label: input.fileLabel,
        file_url: input.fileUrl,
        drive_file_id: input.driveFileId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not attach file.",
    };
  }
}

export async function deleteFunnelStage(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("funnel_stage").delete().eq("id", id);
    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not remove stage.",
    };
  }
}
