import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { entryUrl, logSearchQuery, searchEntries } from "@/lib/search/queries";
import { synthesizeAnswer } from "@/lib/search/ai";

// AI Search MVP (AI Search v1 doc, scoped down): keyword search across
// every entry in the generic Content Module engine, then one Claude call
// synthesizes a grounded answer citing only what was actually retrieved.
// No intent classifier, no embeddings/semantic search, no outcome-ranking
// yet — see the doc for the fuller design this is a first slice of.
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  let result: Awaited<ReturnType<typeof searchEntries>> = null;
  let answer: string | null = null;

  if (query) {
    result = await searchEntries(query);
    if (result && result.entries.length > 0) {
      answer = await synthesizeAnswer(query, result.entries);
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await logSearchQuery(
      query,
      answer,
      result?.entries.map((e) => e.id) ?? [],
      user?.email ?? null,
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Sticky so the question box stays reachable while scrolling a long
          answer/source list, per Jacob's ask. */}
      <div className="sticky top-0 z-10 -mx-8 bg-background px-8 pb-6 pt-8">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          AI Search
        </h1>
        <p className="mt-1 text-sm text-muted">
          Ask a question about what&apos;s in Knowledge, Marketing, Creative,
          Creators, Analytics, or Experiments. Answers only ever come from
          what&apos;s actually on file — if nothing&apos;s recorded, it says so.
        </p>

        <form action="/search" method="get" className="mt-6 flex gap-2">
          <input
            name="q"
            type="text"
            defaultValue={query}
            placeholder="e.g. Which coffee hooks have won?"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Search
          </button>
        </form>
      </div>

      {query && (
        <div className="mt-6">
          {result === null ? (
            <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-sm text-muted">
              Not set up yet. Run{" "}
              <code className="text-xs">supabase/ai_search_schema.sql</code>{" "}
              in the Supabase SQL Editor, and confirm{" "}
              <code className="text-xs">supabase/knowledge_schema.sql</code>{" "}
              (and friends) have already been run.
            </div>
          ) : result.entries.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-6 text-sm text-muted">
              Nothing recorded on this yet — no entry in Knowledge,
              Marketing, Creative, Creators, Analytics, or Experiments
              matched &ldquo;{query}&rdquo;. That&apos;s a real gap, not a
              search failure.
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-5">
              {answer ? (
                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {answer}
                </p>
              ) : (
                <p className="text-sm text-muted">
                  Found matching entries below, but couldn&apos;t generate a
                  summary —{" "}
                  {process.env.ANTHROPIC_API_KEY ? (
                    "hit a snag reaching Claude just now, try searching again in a moment."
                  ) : (
                    <>
                      <code className="text-xs">ANTHROPIC_API_KEY</code>{" "}
                      isn&apos;t configured yet.
                    </>
                  )}
                </p>
              )}

              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Sources
                </p>
                <ul className="mt-2 flex flex-col gap-1">
                  {result.entries.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={entryUrl(e)}
                        className="text-sm text-accent hover:underline"
                      >
                        {e.title}
                      </Link>{" "}
                      <span className="text-xs text-muted">— {e.libraryName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
