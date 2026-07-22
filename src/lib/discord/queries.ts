import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Discord webhook connections (Jacob's ask: automate weekly-results
 * messages to his Discord communities). Every function fails gracefully
 * (returns null/[] or a discriminated error) rather than throwing —
 * same convention used everywhere else in this app.
 */

export type DiscordWebhook = {
  id: string;
  label: string;
  webhook_url: string;
  created_at: string;
};

export async function getDiscordWebhooks(): Promise<DiscordWebhook[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("discord_webhook")
      .select("*")
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as DiscordWebhook[];
  } catch {
    return [];
  }
}

export async function addDiscordWebhook(
  label: string,
  webhookUrl: string,
): Promise<{ ok: true } | { error: string }> {
  const trimmedLabel = label.trim();
  const trimmedUrl = webhookUrl.trim();

  if (!trimmedLabel || !trimmedUrl) {
    return { error: "A label and webhook URL are both required." };
  }
  if (!trimmedUrl.startsWith("https://discord.com/api/webhooks/") &&
      !trimmedUrl.startsWith("https://discordapp.com/api/webhooks/")) {
    return { error: "That doesn't look like a Discord webhook URL." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("discord_webhook")
      .insert({ label: trimmedLabel, webhook_url: trimmedUrl });

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function deleteDiscordWebhook(
  id: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("discord_webhook").delete().eq("id", id);
    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

// Posts one message to a single webhook URL. Discord's webhook API just
// wants { content: "..." } — up to 2000 characters, basic markdown
// (**bold**, *italic*, bullet lines) renders natively in the client.
async function sendToWebhook(
  webhookUrl: string,
  content: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { error: `Discord rejected the message (HTTP ${res.status}): ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't reach Discord." };
  }
}

export type PostResult = { label: string; ok: boolean; error?: string };

// Posts the same message to every configured webhook (Jacob has
// multiple communities) and reports per-webhook success/failure rather
// than collapsing into one pass/fail, since one dead webhook URL
// shouldn't hide whether the others actually went through.
export async function postToAllWebhooks(content: string): Promise<PostResult[]> {
  const webhooks = await getDiscordWebhooks();
  if (webhooks.length === 0) {
    return [];
  }

  const results = await Promise.all(
    webhooks.map(async (w) => {
      const result = await sendToWebhook(w.webhook_url, content);
      return "error" in result
        ? { label: w.label, ok: false, error: result.error }
        : { label: w.label, ok: true };
    }),
  );

  return results;
}
