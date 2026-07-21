import { getShopifyConnectionSummary } from "@/lib/settings/queries";

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
      connected: false,
      detail:
        "Not wired up as a connection yet — Drive links are pasted in manually as Linked documents on entries today.",
      action: null,
    },
    {
      key: "slack",
      icon: "💬",
      name: "Slack",
      connected: false,
      detail: "Not connected yet — no notification system exists to send to it.",
      action: null,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {integrations.map((i) => (
        <div
          key={i.key}
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
        >
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
      ))}
    </div>
  );
}
