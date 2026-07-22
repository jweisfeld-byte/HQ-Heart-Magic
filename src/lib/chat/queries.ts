import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Per-user conversation history for the HQ-wide chat widget. Fails
 * gracefully (returns [] rather than throwing) so the widget just shows
 * an empty conversation if supabase/chat_schema.sql hasn't been run yet
 * — same convention used everywhere else in this app.
 */

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  user_email: string;
  role: ChatRole;
  content: string;
  created_at: string;
};

// Capped at 30 — the widget only needs recent context to render; the
// AI call itself further trims to the last dozen or so (see
// src/lib/chat/ai.ts) to keep the per-message cost bounded.
export async function getChatHistory(
  email: string,
  limit = 30,
): Promise<ChatMessage[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("chat_message")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return (data as ChatMessage[]).reverse();
  } catch {
    return [];
  }
}

export async function appendChatMessage(
  email: string,
  role: ChatRole,
  content: string,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("chat_message").insert({
      user_email: email,
      role,
      content,
    });
  } catch {
    // Best-effort — a failed save shouldn't block the reply the user
    // already received in the widget.
  }
}

export async function clearChatHistory(email: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("chat_message").delete().eq("user_email", email);
  } catch {
    // Swallowed intentionally — worst case the old messages linger.
  }
}
