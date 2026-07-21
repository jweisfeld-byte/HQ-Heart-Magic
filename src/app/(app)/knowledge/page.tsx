import Link from "next/link";
import {
  getEntryCountsByLibrary,
  getLibrariesByGroup,
} from "@/lib/knowledge/queries";

// Mini-hub (Application Architecture v1, Template G / Section 4): 7 cards,
// one per Knowledge collection, each linking into that collection's List
// View. Entry counts are live once supabase/knowledge_schema.sql has been
// run; until then this renders an honest "not set up yet" state instead
// of crashing.
export default async function KnowledgePage() {
  const libraries = await getLibrariesByGroup("knowledge");

  if (!libraries || libraries.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          Knowledge
        </h1>
        <p className="mt-2 text-sm text-muted">
          Brand Knowledge, Product Knowledge, Customer Psychology, SOPs, Team
          Knowledge, Wholesale, Future Ideas.
        </p>
        <div className="mt-8 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          Not set up yet. Run{" "}
          <code className="text-xs">supabase/knowledge_schema.sql</code> in
          the Supabase SQL Editor to create and seed the Knowledge tables.
        </div>
      </div>
    );
  }

  const counts = await getEntryCountsByLibrary(libraries.map((l) => l.id));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Knowledge
      </h1>
      <p className="mt-2 text-sm text-muted">
        The company&apos;s brain — one authoritative answer per question,
        instead of living in someone&apos;s head.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {libraries.map((lib) => {
          const count = counts[lib.id] ?? 0;
          return (
            <Link
              key={lib.id}
              href={`/knowledge/${lib.key}`}
              className="rounded-xl border border-border bg-surface p-5 transition hover:border-accent/40 hover:bg-accent/5"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl" aria-hidden>
                  {lib.icon}
                </span>
                <span className="rounded-full bg-accent-soft/30 px-2.5 py-0.5 text-xs font-medium text-accent">
                  {count} {count === 1 ? "entry" : "entries"}
                </span>
              </div>
              <h2 className="mt-3 font-display text-base font-semibold text-foreground">
                {lib.name}
              </h2>
              <p className="mt-1 text-sm text-muted">{lib.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
