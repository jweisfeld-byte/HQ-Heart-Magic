import { createClient } from "@/lib/supabase/server";
import {
  getLowInventoryVariants,
  getRecentOrders,
  getConversionRateLastWeek,
  getTodaySalesByChannel,
  getSalesLast30Days,
} from "@/lib/shopify/queries";
import { getQuoteOfTheDay } from "@/lib/quotes";
import { getTasks, getTasksDueToday } from "@/lib/tasks/queries";
import { TasksPreviewCard } from "@/components/dashboard/TasksPreviewCard";
import { getOrganizationSettings, listWorkspaceUsers } from "@/lib/settings/queries";
import { getProjects } from "@/lib/projects/queries";
import { nameFromEmail } from "@/lib/format";
import { getPersonRecommendation, type PersonConfig } from "@/lib/recommendations/service";

type BriefingLine = {
  label: string;
  status: "connected" | "pending";
  detail: string;
};

// Real focus areas (Jacob's own description) — passed to the AI as
// role context so the recommendation is actually tailored per person,
// not generic advice.
const REVENUE_FOCUS_PEOPLE: PersonConfig[] = [
  {
    name: "Jacob",
    focusArea:
      "Handles wholesale clients, creates ad creative, and optimizes the website and advertorials.",
  },
  {
    name: "Marco",
    focusArea: "Focused on organic content and TikTok creator management.",
  },
  {
    name: "Chris",
    focusArea:
      "Focused on funnel management, loading ads into TikTok and Meta, and testing creative.",
  },
];

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

  const [
    lowInventory,
    recentOrders,
    conversion,
    todaySales,
    salesLast30Days,
    tasksDueToday,
    allTasks,
    org,
    users,
    allProjects,
  ] = await Promise.all([
    getLowInventoryVariants(),
    getRecentOrders(8),
    getConversionRateLastWeek(),
    getTodaySalesByChannel(),
    getSalesLast30Days(),
    getTasksDueToday(),
    getTasks(),
    getOrganizationSettings(),
    listWorkspaceUsers(),
    getProjects(),
  ]);

  // Jacob's own upload (Settings > Appearance) wins over the default
  // mountain photo once he's set one.
  const backgroundUrl = org?.dashboard_background_url || "/dashboard-mountain.jpg";

  // Today's revenue-focus recommendation per person (Jacob's ask) — one
  // Claude call per person, cached per day (see getPersonRecommendation),
  // grounded in their own open tasks/projects plus today's live numbers.
  const businessSnapshot = {
    conversionRateText: conversion
      ? `${formatPercent(conversion.conversionRate)} (${conversion.completedCheckouts} of ${conversion.sessions} sessions, last 7 days)`
      : "not connected",
    todaySalesText: todaySales
      ? `Shopify ${formatMoney(todaySales.shopify.totalRevenue, todaySales.shopify.currency)} (${todaySales.shopify.orderCount} orders), TikTok ${formatMoney(todaySales.tiktok.totalRevenue, todaySales.tiktok.currency)} (${todaySales.tiktok.orderCount} orders)`
      : "not connected",
    salesLast30DaysText: salesLast30Days
      ? `${formatMoney(salesLast30Days.totalRevenue, salesLast30Days.currency)} across ${salesLast30Days.orderCount} orders`
      : "not connected",
    lowInventoryText:
      lowInventory && lowInventory.length > 0
        ? `${lowInventory.length} variant${lowInventory.length === 1 ? "" : "s"} running low`
        : lowInventory
          ? "nothing low on stock"
          : "not connected",
  };

  const recommendations = await Promise.all(
    REVENUE_FOCUS_PEOPLE.map((person) => {
      const email =
        users?.find((u) => nameFromEmail(u.email) === person.name)?.email ?? null;
      return getPersonRecommendation(
        person,
        email,
        allTasks ?? [],
        allProjects ?? [],
        businessSnapshot,
      );
    }),
  );

  // Whoever's logged in sees their own "one thing to do today" card
  // first (Jacob's ask) — everyone else keeps the original relative
  // order below it. `firstName` is already derived from the logged-in
  // user's email above, so this is just a stable sort keyed on a
  // match against that.
  const revenueFocusCards = REVENUE_FOCUS_PEOPLE.map((person, i) => ({
    person,
    recommendation: recommendations[i],
  })).sort((a, b) => {
    const aIsMe = a.person.name === firstName ? 0 : 1;
    const bIsMe = b.person.name === firstName ? 0 : 1;
    return aIsMe - bIsMe;
  });

  return (
    // Full-bleed background photo behind the whole dashboard (Jacob's
    // ask) — negative margins cancel out <main>'s own padding so the
    // image reaches the edges, then the same padding is re-applied
    // inside. Dark scrim layered over the photo keeps existing text
    // readable regardless of light/dark theme.
    <div
      className="-mx-8 -mt-8 min-h-screen bg-cover bg-center px-8 pt-8 pb-16"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url('${backgroundUrl}')`,
      }}
    >
      <div className="mx-auto max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-semibold text-black">
          Good morning, {firstName}.
        </h1>
        <p className="mt-1 text-lg italic text-black">
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
        {/* Today's tasks — clickable, expands into the full Tasks board */}
        <TasksPreviewCard tasksDueToday={tasksDueToday} allTasks={allTasks} users={users ?? []} />

        {/* Per-person "one thing to drive revenue today" (Jacob's ask) —
            same stub-card treatment as the rest of the not-yet-built
            briefing lines below, just placed right under Today's tasks. */}
        {revenueFocusCards.map(({ person, recommendation }) => {
          const isMe = person.name === firstName;
          return (
            <div
              key={person.name}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span
                  className={
                    isMe
                      ? "text-base font-semibold text-black"
                      : "font-medium text-foreground"
                  }
                >
                  {isMe
                    ? "What\u2019s the one thing I can do today to drive the most revenue?"
                    : `What's the one thing ${person.name} can do today to drive the most revenue?`}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    recommendation
                      ? "bg-green-100 text-green-700"
                      : "bg-accent-soft/30 text-accent"
                  }`}
                >
                  {recommendation ? "Live" : "Not connected yet"}
                </span>
              </div>
              <p
                className={
                  isMe ? "mt-1 text-base text-black" : "mt-1 text-sm text-muted"
                }
              >
                {recommendation ??
                  "Waiting on an ANTHROPIC_API_KEY in Vercel to power this — see Settings."}
              </p>
            </div>
          );
        })}

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
    </div>
  );
}
