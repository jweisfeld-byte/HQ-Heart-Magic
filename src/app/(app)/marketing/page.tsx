import { HubPage } from "@/components/knowledge/HubPage";

// Mini-hub: 4 cards (Marketing, Meta Ads, Advertorials, Email), per
// Application Architecture v1 Section 4.
export default function MarketingPage() {
  return (
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
  );
}
