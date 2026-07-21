import { HubPage } from "@/components/knowledge/HubPage";

// Mini-hub: 2 cards (UGC, Creative Library), per Application Architecture
// v1 Section 4.
export default function CreativePage() {
  return (
    <HubPage
      groupKey="creative"
      basePath="/creative"
      title="Creative"
      subtitle="Creator-sourced content strategy, plus the raw asset repository — indexed from Google Drive, not duplicated here."
      emptyHint={
        <>
          Not set up yet. Run{" "}
          <code className="text-xs">supabase/creative_schema.sql</code> in
          the Supabase SQL Editor to create and seed the Creative tables.
        </>
      }
    />
  );
}
