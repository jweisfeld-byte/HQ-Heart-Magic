import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getLowInventoryVariants,
  getRecentOrders,
  getConversionRateLastWeek,
  getTodaySalesByChannel,
  getSalesLast30Days,
} from "@/lib/shopify/queries";
import { getQuoteOfTheDay } from "@/lib/quotes";
import {
  getTasksDueToday,
  STATUS_LABELS,
  STATUS_STYLES,
} from "@/lib/tasks/queries";

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

  const rawFirstName = user?.email?.split("@")[0] ?? "there";
  const firstName =
    rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1);
  const quote = getQuoteOfTheDay();

  const [lowInventory, recentOrders, conversion, todaySales, salesLast30Days, tasksDueToday] =
    await Promise.all([
      getLowInventoryVariants(),
      getRecentOrders(8),
      getConversionRateLastWeek(),
      getTodaySalesByChannel(),
      getSalesLast30Days(),
      getTasksDueToday(),
    ]);

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Good morning, {firstName}.
        </h1>
        <p className="mt-1 text-sm italic text-muted">
          &ldquo;{quote.text}&rdquo; <span className="not-italic">— {quote.author}</span>
        </p>
      </div>

      {/* Little square tiles per Jacob's ask: conversion rate + today's
          sales, split by channel (Shopify's own store vs. TikTok — both
          land in the same Orders list, split via channelInformation).
          Own row, side by side, so they never wrap under the header text. */}
      <div className="mt-4 flex flex-nowrap gap-3">
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
                <p className="mt-2 font-display text-2xl font-semibold text-green-500">
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

          <div className="flex w-40 shrink-0 flex-col rounded-xl border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">
                Sales today
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  todaySales
                    ? "bg-green-100 text-green-700"
                    : "bg-accent-soft/30 text-accent"
                }`}
              >
                {todaySales ? "Live" : "N/A"}
              </span>
            </div>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted">
              Shopify
            </p>
            {todaySales ? (
              <>
                <p className="mt-1 font-display text-2xl font-semibold text-green-500">
                  {formatMoney(todaySales.shopify.totalRevenue, todaySales.shopify.currency)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {todaySales.shopify.orderCount} order
                  {todaySales.shopify.orderCount === 1 ? "" : "s"}
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-muted">
                Waiting on the Shopify connection.
              </p>
            )}
          </div>

          <div className="flex w-40 shrink-0 flex-col rounded-xl border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">
                Sales today
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  todaySales
                    ? "bg-green-100 text-green-700"
                    : "bg-accent-soft/30 text-accent"
                }`}
              >
                {todaySales ? "Live" : "N/A"}
              </span>
            </div>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-muted">
              TikTok
            </p>
            {todaySales ? (
              <>
                <p className="mt-1 font-display text-2xl font-semibold text-green-500">
                  {formatMoney(todaySales.tiktok.totalRevenue, todaySales.tiktok.currency)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {todaySales.tiktok.orderCount} order
                  {todaySales.tiktok.orderCount === 1 ? "" : "s"}
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-muted">
                Waiting on the Shopify connection.
              </p>
            )}
          </div>

          <div className="flex w-40 shrink-0 flex-col rounded-xl border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">
                Sales (30d)
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  salesLast30Days
                    ? "bg-green-100 text-green-700"
                    : "bg-accent-soft/30 text-accent"
                }`}
              >
                {salesLast30Days ? "Live" : "N/A"}
              </span>
            </div>
            {salesLast30Days ? (
              <>
                <p className="mt-2 font-display text-2xl font-semibold text-green-500">
                  {formatMoney(salesLast30Days.totalRevenue, salesLast30Days.currency)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {salesLast30Days.orderCount} order{salesLast30Days.orderCount === 1 ? "" : "s"}{" "}
                  · trailing 30 days
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-muted">
                Waiting on the Shopify connection.
              </p>
            )}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {/* Today's tasks — preview of the Tasks board, due today */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">Today&apos;s tasks</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                tasksDueToday
                  ? "bg-green-100 text-green-700"
                  : "bg-accent-soft/30 text-accent"
              }`}
            >
              {tasksDueToday ? "Live" : "Not connected yet"}
            </span>
          </div>
          {tasksDueToday ? (
            tasksDueToday.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-2">
                {tasksDueToday.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3">
                    <Link
                      href={`/tasks/${t.id}`}
                      className="truncate text-sm text-foreground hover:text-accent"
                    >
                      {t.title}
                    </Link>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[t.status]}`}
                    >
                      {STATUS_LABELS[t.status]}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-muted">
                Nothing due today.
              </p>
            )
          ) : (
            <p className="mt-1 text-sm text-muted">
              Waiting on{" "}
              <code className="text-xs">supabase/tasks_schema.sql</code> to be
              run.
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
