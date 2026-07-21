import { createClient } from "@/lib/supabase/server";
import {
  getYesterdayRevenue,
  getLowInventoryVariants,
  getRecentOrders,
  getConversionRateLastWeek,
} from "@/lib/shopify/queries";
import { getQuoteOfTheDay } from "@/lib/quotes";

type BriefingLine = {
  label: string;
  status: "connected" | "pending";
  detail: string;
};

const STUB_BRIEFING_LINES: BriefingLine[] = [
  {
    label: "Top-performing creative",
    status: "pending",
    detail: "Waiting on Creative Library / Meta Ads entries with a logged outcome.",
  },
  {
    label: "Biggest drop in performance",
    status: "pending",
    detail: "Waiting on the anomaly-check job (Backlog B7) and Klaviyo sync.",
  },
  {
    label: "New customer reviews",
    status: "pending",
    detail: "Reviews ingestion approach not yet decided (Backlog D1).",
  },
  {
    label: "Experiments ending this week",
    status: "pending",
    detail: "Waiting on Experiments entries with start/end dates.",
  },
  {
    label: "Today's recommendations",
    status: "pending",
    detail: "Waiting on the daily AI-recommendations job (Backlog B7).",
  },
];

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatPercent(fraction: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fraction);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName = user?.email?.split("@")[0] ?? "there";
  const quote = getQuoteOfTheDay();

  const [revenue, lowInventory, recentOrders, conversion] = await Promise.all([
    getYesterdayRevenue(),
    getLowInventoryVariants(),
    getRecentOrders(8),
    getConversionRateLastWeek(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Good morning, {firstName}.
          </h1>
          <p className="mt-1 text-sm italic text-muted">
            &ldquo;{quote.text}&rdquo; <span className="not-italic">— {quote.author}</span>
          </p>
        </div>

        {/* Conversion rate, last 7 days — little square tile per Jacob's ask */}
        <div className="flex w-40 shrink-0 flex-col rounded-xl border border-border bg-surface p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">
              Conversion rate
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                conversion
                  ? "bg-green-100 text-green-700"
                  : "bg-accent-soft/30 text-accent"
              }`}
            >
              {conversion ? "Live" : "N/A"}
            </span>
          </div>
          {conversion ? (
            <>
              <p className="mt-2 font-display text-2xl font-semibold text-foreground">
                {formatPercent(conversion.conversionRate)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {conversion.completedCheckouts} of {conversion.sessions} sessions
                · last 7 days
              </p>
            </>
          ) : (
            <p className="mt-2 text-xs text-muted">
              Needs the <code className="text-[10px]">read_reports</code> scope.
              Re-run <code className="text-[10px]">/api/shopify/install</code>{" "}
              to reconnect.
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {/* Revenue yesterday — live from Shopify once connected */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Revenue yesterday</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                revenue
                  ? "bg-green-100 text-green-700"
                  : "bg-accent-soft/30 text-accent"
              }`}
            >
              {revenue ? "Live" : "Not connected yet"}
            </span>
          </div>
          {revenue ? (
            <p className="mt-1 text-sm text-muted">
              {formatMoney(revenue.totalRevenue, revenue.currency)} across{" "}
              {revenue.orderCount} order{revenue.orderCount === 1 ? "" : "s"}.
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">
              Waiting on the Shopify connection. Visit{" "}
              <code className="text-xs">/api/shopify/install</code> once to
              connect the store.
            </p>
          )}
        </div>

        {/* Inventory alerts — live from Shopify once connected */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Inventory alerts</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                lowInventory
                  ? "bg-green-100 text-green-700"
                  : "bg-accent-soft/30 text-accent"
              }`}
            >
              {lowInventory ? "Live" : "Not connected yet"}
            </span>
          </div>
          {lowInventory ? (
            lowInventory.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-1 text-sm text-muted">
                {lowInventory.map((v, i) => (
                  <li key={i}>
                    {v.productTitle}
                    {v.variantTitle !== "Default Title" ? ` — ${v.variantTitle}` : ""}:{" "}
                    <span className="font-medium text-foreground">
                      {v.quantity} left
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted">
                Nothing low on stock right now.
              </p>
            )
          ) : (
            <p className="mt-1 text-sm text-muted">
              Waiting on Shopify sync (Backlog B1) for commerce_inventory.
            </p>
          )}
        </div>

        {STUB_BRIEFING_LINES.map((line) => (
          <div
            key={line.label}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">
                {line.label}
              </span>
              <span className="rounded-full bg-accent-soft/30 px-2.5 py-0.5 text-xs font-medium text-accent">
                Not connected yet
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">{line.detail}</p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Recent orders
        </h2>
        {recentOrders ? (
          recentOrders.length > 0 ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="px-4 py-2 font-medium">Order</th>
                    <th className="px-4 py-2 font-medium">Customer</th>
                    <th className="px-4 py-2 font-medium">Total</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.name} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-medium text-foreground">{o.name}</td>
                      <td className="px-4 py-2 text-muted">{o.customerName ?? "—"}</td>
                      <td className="px-4 py-2 text-muted">
                        {formatMoney(o.total, o.currency)}
                      </td>
                      <td className="px-4 py-2 text-muted">
                        {o.financialStatus ?? "—"} / {o.fulfillmentStatus ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-muted">{formatDate(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">No orders yet.</p>
          )
        ) : (
          <p className="mt-2 text-sm text-muted">
            Waiting on the Shopify connection. Visit{" "}
            <code className="text-xs">/api/shopify/install</code> once to
            connect the store.
          </p>
        )}
      </div>
    </div>
  );
}
