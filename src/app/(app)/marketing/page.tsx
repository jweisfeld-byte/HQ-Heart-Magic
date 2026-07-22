import Link from "next/link";
import { HubPage } from "@/components/knowledge/HubPage";

// Mini-hub: 4 cards (Marketing, Meta Ads, Advertorials, Email), per
// Application Architecture v1 Section 4.
export default function MarketingPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/marketing/funnels"
        className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 transition hover:border-accent/40 hover:bg-accent/5"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>
              🔻
            </span>
            <h2 className="font-display text-base font-semibold text-foreground">
              Funnels
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted">
            Every funnel as a triangle you build out stage by stage with the actual creative.
          </p>
        </div>
        <span className="text-sm text-accent">View →</span>
      </Link>

      <div className="mt-6">
        <HubPage
          groupKey="marketing"
          basePath="/marketing"
          title="Marketing"
          subtitle="What's actively being run — channel-agnostic strategy plus the channel-specific depth for Meta Ads, Advertorials, and Email."
          emptyHint={
            <>
              Not set up yet. Run{" "}
              <code className="text-xs">supabase/marketing_schema.sql</code> in
              the Supabase SQL Editor to create and seed the Marketing tables.
            </>
          }
        />
      </div>
    </div>
  );
}
