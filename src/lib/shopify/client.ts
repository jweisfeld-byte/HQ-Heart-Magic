import { createAdminClient } from "@/lib/supabase/admin";

const API_VERSION = "2025-01";

export type ShopifyConnection = {
  shop_domain: string;
  access_token: string;
};

/**
 * Looks up the stored offline access token for this shop from Supabase.
 * Returns null if the app hasn't completed the OAuth install flow yet
 * (see /api/shopify/install), so callers can render a "not connected yet"
 * state instead of throwing.
 */
export async function getShopifyConnection(): Promise<ShopifyConnection | null> {
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  if (!shopDomain) return null;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("shopify_connection")
      .select("shop_domain, access_token")
      .eq("shop_domain", shopDomain)
      .maybeSingle();

    if (error || !data) return null;
    return data as ShopifyConnection;
  } catch {
    return null;
  }
}

/**
 * Executes a query/mutation against the Shopify Admin GraphQL API using the
 * stored offline access token. Returns null on any failure so dashboard
 * tiles can fall back gracefully rather than crashing the page.
 */
export async function shopifyAdminGraphQL<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T | null> {
  const connection = await getShopifyConnection();
  if (!connection) return null;

  try {
    const res = await fetch(
      `https://${connection.shop_domain}/admin/api/${API_VERSION}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": connection.access_token,
        },
        body: JSON.stringify({ query, variables }),
        // Dashboard tiles want fresh data on every load.
        cache: "no-store",
      },
    );

    if (!res.ok) return null;

    const json = await res.json();
    if (json.errors) return null;
    return json.data as T;
  } catch {
    return null;
  }
}
