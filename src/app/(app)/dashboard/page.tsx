import { createClient } from "@/lib/supabase/server";

type BriefingLine = {
  label: string;
  status: "connected" | "pending";
  detail: string;
};

const BRIEFING_LINES: BriefingLine[] = [
  {
    label: "Revenue yesterday",
    status: "pending",
    detail: "Waiting on Shopify sync (Backlog B1) to populate commerce_orders.",
  },
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
    label: "Inventory alerts",
    status: "pending",
    detail: "Waiting on Shopify sync (Backlog B1) for commerce_inventory.",
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

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Good morning, {firstName}.
      </h1>
      <p className="mt-1 text-sm text-muted">
        This is the Today View shell — the real briefing lines up here once
        each data source is wired in. Nothing below is invented; each line
        says plainly what it&apos;s waiting on.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        {BRIEFING_LINES.map((line) => (
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
    </div>
  );
}
