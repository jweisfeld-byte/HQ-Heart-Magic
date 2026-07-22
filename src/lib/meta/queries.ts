import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Meta Marketing API (Graph API) client for Jacob's own ad account —
 * "Standard Access" scope, which only requires a System User access
 * token with ads_management/ads_read/business_management permissions.
 * No App Review or Business Verification is needed since this never
 * manages ads on behalf of another business (that's "Advanced Access").
 *
 * Every function here fails gracefully (returns null) rather than
 * throwing — same convention used everywhere else in this app — so a
 * missing connection or a Graph API hiccup shows an honest "not
 * connected" state instead of crashing a page.
 */

// Bump this if Meta deprecates the version — Graph API versions are
// typically supported for ~2 years after release.
const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export type MetaConnection = {
  ad_account_id: string;
  access_token: string;
  connected_at: string;
  updated_at: string;
};

export type MetaConnectionSummary = {
  adAccountId: string;
  connectedAt: string;
};

export async function getMetaConnection(): Promise<MetaConnection | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("meta_connection")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data as MetaConnection;
  } catch {
    return null;
  }
}

// Display-safe summary (no access token) for the Integrations page.
export async function getMetaConnectionSummary(): Promise<MetaConnectionSummary | null> {
  const connection = await getMetaConnection();
  if (!connection) return null;
  return {
    adAccountId: connection.ad_account_id,
    connectedAt: connection.connected_at,
  };
}

// Only one Meta connection ever exists (Jacob's own ad account) — any
// previous row is cleared first so reconnecting with a new account ID
// doesn't leave a stale row behind.
export async function saveMetaConnection(input: {
  adAccountId: string;
  accessToken: string;
}): Promise<{ ok: true } | { error: string }> {
  const adAccountId = input.adAccountId.trim().replace(/^act_/, "");
  const accessToken = input.accessToken.trim();

  if (!adAccountId || !accessToken) {
    return { error: "Ad account ID and access token are both required." };
  }

  try {
    const supabase = createAdminClient();
    await supabase.from("meta_connection").delete().neq("ad_account_id", "");

    const { error } = await supabase.from("meta_connection").insert({
      ad_account_id: adAccountId,
      access_token: accessToken,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export async function disconnectMeta(): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("meta_connection")
      .delete()
      .neq("ad_account_id", "");

    if (error) return { error: error.message };
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error." };
  }
}

export type MetaAdSummary = {
  id: string;
  name: string;
  status: string;
  thumbnailUrl: string | null;
};

// Lists the account's most recent ads (any status) for the manual
// picker — Jacob confirmed manual selection over auto-matching by
// naming convention, so this just needs to be browsable/searchable,
// not perfectly matched automatically.
//
// Returns a discriminated result (not just null on any failure) so the
// caller — and ultimately the picker UI — can tell "you haven't
// connected Meta Ads yet" apart from "you're connected, but the actual
// Graph API call failed" (bad/expired token, wrong ad account id,
// missing permission, etc.). Collapsing both into one generic message
// was actively misleading once a connection existed but the token
// itself was the problem.
export async function listRecentAds(
  query?: string,
): Promise<{ ads: MetaAdSummary[] } | { error: string }> {
  const connection = await getMetaConnection();
  if (!connection) {
    return { error: "Meta Ads isn't connected yet — see Settings > Integrations." };
  }

  try {
    const url = new URL(`${GRAPH_API_BASE}/act_${connection.ad_account_id}/ads`);
    url.searchParams.set("fields", "id,name,effective_status,creative{thumbnail_url}");
    url.searchParams.set("limit", "100");
    url.searchParams.set("access_token", connection.access_token);

    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const metaMessage = json?.error?.message;
      return {
        error: metaMessage
          ? `Meta rejected the request: ${metaMessage}`
          : `Meta API error (HTTP ${res.status}). Check the ad account ID and access token in Settings > Integrations.`,
      };
    }
    if (!json || !Array.isArray(json.data)) {
      return { error: "Meta returned an unexpected response." };
    }

    type RawAd = {
      id: string;
      name: string;
      effective_status: string;
      creative?: { thumbnail_url?: string };
    };

    let ads: MetaAdSummary[] = (json.data as RawAd[]).map((ad) => ({
      id: ad.id,
      name: ad.name,
      status: ad.effective_status,
      thumbnailUrl: ad.creative?.thumbnail_url ?? null,
    }));

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      ads = ads.filter((ad) => ad.name.toLowerCase().includes(q));
    }

    return { ads };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Couldn't reach Meta — try again.",
    };
  }
}

export type MetaAdInsights = {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number | null;
};

// Trailing-30-day performance for a single ad. ROAS isn't included —
// accuracy depends on Pixel/Conversions API setup that isn't confirmed
// yet, so this sticks to metrics Meta reports directly off ad delivery.
export async function getAdInsights(adId: string): Promise<MetaAdInsights | null> {
  const connection = await getMetaConnection();
  if (!connection) return null;

  try {
    const url = new URL(`${GRAPH_API_BASE}/${adId}/insights`);
    url.searchParams.set("fields", "spend,impressions,clicks,ctr,cpc");
    url.searchParams.set("date_preset", "last_30d");
    url.searchParams.set("access_token", connection.access_token);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    const row = Array.isArray(json.data) ? json.data[0] : null;
    if (!row) return null;

    return {
      spend: Number(row.spend ?? 0),
      impressions: Number(row.impressions ?? 0),
      clicks: Number(row.clicks ?? 0),
      ctr: Number(row.ctr ?? 0),
      cpc: row.cpc ? Number(row.cpc) : null,
    };
  } catch {
    return null;
  }
}
