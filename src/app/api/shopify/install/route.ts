import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

// One-time (or re-run-if-ever-needed) route that kicks off the Shopify
// OAuth install flow for the Heart Magic HQ custom app. Visiting this URL
// redirects to Shopify's consent screen; Shopify then redirects back to
// /api/shopify/callback with a code we exchange for an offline access token.
export async function GET() {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  const appUrl = process.env.SHOPIFY_APP_URL;

  if (!apiKey || !shopDomain || !appUrl) {
    return NextResponse.json(
      {
        error:
          "Missing SHOPIFY_API_KEY, SHOPIFY_SHOP_DOMAIN, or SHOPIFY_APP_URL env vars.",
      },
      { status: 500 },
    );
  }

  const scopes = [
    "read_orders",
    "read_products",
    "read_inventory",
    "read_locations",
    "read_customers",
  ].join(",");

  const state = randomBytes(16).toString("hex");
  const redirectUri = `${appUrl}/api/shopify/callback`;

  const authorizeUrl = new URL(`https://${shopDomain}/admin/oauth/authorize`);
  authorizeUrl.searchParams.set("client_id", apiKey);
  authorizeUrl.searchParams.set("scope", scopes);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());
  response.cookies.set("shopify_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 10,
    path: "/",
  });

  return response;
}
