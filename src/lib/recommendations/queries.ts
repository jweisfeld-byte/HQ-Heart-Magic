import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Same fail-gracefully convention as the rest of the app: returns null
 * rather than throwing if supabase/revenue_recommendations_schema.sql
 * hasn't been run yet, so the dashboard just shows the recommendation
 * as "not connected" instead of erroring.
 */
export async function getCachedRecommendation(
  personName: string,
  date: string,
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("revenue_recommendation")
      .select("recommendation")
      .eq("person_name", personName)
      .eq("recommendation_date", date)
      .maybeSingle();

    if (error || !data) return null;
    return data.recommendation as string;
  } catch {
    return null;
  }
}

// Best-effort cache write — a failed save just means the next dashboard
// load regenerates instead of reading from cache, not a hard error.
export async function saveRecommendation(
  personName: string,
  date: string,
  recommendation: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("revenue_recommendation").upsert(
      { person_name: personName, recommendation_date: date, recommendation },
      { onConflict: "person_name,recommendation_date" },
    );
  } catch {
    // ignore — see comment above
  }
}
