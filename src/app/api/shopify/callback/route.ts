import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Completes the Shopify OAuth handshake started by /api/shopify/install.
// Exchanges the authorization code for a permanent offline access token and
// stores it in Supabase (shopify_connection table, service-role only) so
// server components can read live store data on every page load.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const shop = searchParams.get("shop");
  const state = searchParams.get("state");

  const expectedState = request.cookies.get("shopify_oauth_state")?.value;

  if (!code || !shop) {
    return NextResponse.json(
      { error: "Missing code or shop query param." },
      { status: 400 },
    );
  }

  if (!expectedState || expectedState !== state) {
    return NextResponse.json(
      { error: "State mismatch. Please restart the install at /api/shopify/install." },
      { status: 400 },
    );
  }

  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecret = process.env.SHOPIFY_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Missing SHOPIFY_API_KEY or SHOPIFY_API_SECRET env vars." },
      { status: 500 },
    );
  }

  const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: apiSecret,
      code,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.json(
      { error: "Shopify token exchange failed.", status: tokenRes.status },
      { status: 502 },
    );
  }

  const tokenJson = (await tokenRes.json()) as {
    access_token: string;
    scope: string;
  };

  const supabase = createAdminClient();
  const { error } = await supabase.from("shopify_connection").upsert(
    {
      shop_domain: shop,
      access_token: tokenJson.access_token,
      scope: tokenJson.scope,
    },
    { onConflict: "shop_domain" },
  );

  if (error) {
    return NextResponse.json(
      { error: "Failed to store Shopify connection.", details: error.message },
      { status: 500 },
    );
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.delete("shopify_oauth_state");
  return response;
}
