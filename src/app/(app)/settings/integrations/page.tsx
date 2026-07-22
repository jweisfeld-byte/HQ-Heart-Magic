import { getShopifyConnectionSummary } from "@/lib/settings/queries";
import { getMetaConnectionSummary } from "@/lib/meta/queries";
import { connectMetaAction, disconnectMetaAction } from "@/app/(app)/settings/actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Template F, custom rows (IntegrationHealthCard — Screens & Flows v1
// Section 7: "provider icon, status, last-synced, reconnect action").
// Shopify is real, queried live; the rest are honestly "not connected"
// rather than faked, since nothing in this codebase talks to them yet.
export default async function IntegrationsSettingsPage() {
  const shopify = await getShopifyConnectionSummary();
  const meta = await getMetaConnectionSummary();

  const integrations = [
    {
      key: "shopify",
      icon: "🛍️",
      name: "Shopify",
      connected: !!shopify,
      detail: shopify
        ? `${shopify.shopDomain} · connected ${formatDate(shopify.installedAt)}`
        : "Powers the dashboard's revenue, inventory, and recent orders tiles.",
      action: shopify ? null : "/api/shopify/install",
    },
    {
      key: "meta",
      icon: "📣",
      name: "Meta Ads",
      connected: !!meta,
      detail: meta
        ? `Ad account ${meta.adAccountId} · connected ${formatDate(meta.connectedAt)}`
        : "Link a Meta ad to any funnel format and pull live spend/impressions/CTR.",
      action: null,
    },
    {
      key: "klaviyo",
      icon: "✉️",
      name: "Klaviyo",
      connected: false,
      detail: "Not connected yet — would power Email module metrics.",
      action: null,
    },
    {
      key: "quickbooks",
      icon: "💰",
      name: "QuickBooks",
      connected: false,
      detail: "Not connected yet — would power the Finance domain (not built).",
      action: null,
    },
    {
      key: "drive",
      icon: "📁",
      name: "Google Drive",
      connected: true,
      detail:
        "Connected via the Drive Picker (Google OAuth) — attach a real Drive file to any entry's Linked documents without pasting a URL.",
      action: null,
    },
    {
      key: "discord",
      icon: "🎮",
      name: "Discord",
      connected: false,
      detail: "Not connected yet — no notification system exists to send to it.",
      action: null,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {integrations.map((i) => (
        <div key={i.key} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden>
                {i.icon}
              </span>
              <div>
                <p className="font-medium text-foreground">{i.name}</p>
                <p className="text-sm text-muted">{i.detail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {i.action && (
                <a
                  href={i.action}
                  className="text-sm text-accent hover:underline"
                >
                  Connect
                </a>
              )}
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  i.connected
                    ? "bg-green-100 text-green-700"
                    : "bg-accent-soft/30 text-accent"
                }`}
              >
                {i.connected ? "Connected" : "Not connected"}
              </span>
            </div>
          </div>

          {i.key === "meta" && (
            <div className="border-t border-border pt-3">
              {meta ? (
                <form action={disconnectMetaAction}>
                  <button
                    type="submit"
                    className="text-xs font-medium text-muted underline hover:text-red-600"
                  >
                    Disconnect Meta Ads
                  </button>
                </form>
              ) : (
                <form
                  action={connectMetaAction}
                  className="flex flex-wrap items-end gap-3"
                >
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      Ad account ID
                    </label>
                    <input
                      name="adAccountId"
                      required
                      placeholder="e.g. 123456789012345"
                      className="mt-1 w-56 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">
                      System User access token
                    </label>
                    <input
                      name="accessToken"
                      type="password"
                      required
                      placeholder="Paste token"
                      className="mt-1 w-64 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                  >
                    Connect
                  </button>
                  <p className="w-full text-xs text-muted">
                    From Meta Business Settings: create a Meta App, add the
                    Marketing API product, then generate a System User
                    access token scoped to just this ad account (Standard
                    Access — no App Review needed for your own account).
                  </p>
                </form>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
