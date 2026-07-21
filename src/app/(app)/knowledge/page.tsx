import { HubPage } from "@/components/knowledge/HubPage";

// Mini-hub (Application Architecture v1, Template G / Section 4): 7 cards,
// one per Knowledge collection.
export default function KnowledgePage() {
  return (
    <HubPage
      groupKey="knowledge"
      basePath="/knowledge"
      title="Knowledge"
      subtitle="The company's brain — one authoritative answer per question, instead of living in someone's head."
      emptyHint={
        <>
          Not set up yet. Run{" "}
          <code className="text-xs">supabase/knowledge_schema.sql</code> in
          the Supabase SQL Editor to create and seed the Knowledge tables.
        </>
      }
    />
  );
}
