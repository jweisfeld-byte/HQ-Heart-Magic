import { createAdminClient } from "@/lib/supabase/admin";

export type SearchResultEntry = {
  id: string;
  title: string;
  body: string;
  libraryKey: string;
  libraryName: string;
  groupKey: string;
};

// Flat groups render at /{groupKey}/{entryId}; the rest (Knowledge,
// Marketing, Creative) have multiple libraries per group and render at
// /{groupKey}/{libraryKey}/{entryId} — see LibraryListPage/EntryDetailFormPage.
const FLAT_GROUPS = new Set(["creators", "analytics", "experiments"]);

export function entryUrl(entry: Pick<SearchResultEntry, "groupKey" | "libraryKey" | "id">) {
  if (FLAT_GROUPS.has(entry.groupKey)) {
    return `/${entry.groupKey}/${entry.id}`;
  }
  return `/${entry.groupKey}/${entry.libraryKey}/${entry.id}`;
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "have", "has", "had",
  "which", "what", "who", "how", "why", "when", "where", "do", "does",
  "did", "of", "on", "in", "to", "for", "and", "or", "we", "our", "us",
  "show", "me", "find", "every", "all", "any", "that", "this", "with",
  "been", "it", "its", "about", "than", "from", "there", "been",
]);

function extractKeywords(query: string): string[] {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
    ),
  );
}

/**
 * Plain keyword search (no embeddings/semantic search yet — AI Search v1
 * doc, Section 3 flags that as future work) across every entry in the
 * generic Content Module engine. Extracts keywords from a natural-language
 * question, matches any of them against title/body, then ranks results in
 * JS by how many distinct keywords each entry actually contains.
 */
export async function searchEntries(
  query: string,
  limit = 8,
): Promise<{ entries: SearchResultEntry[]; keywords: string[] } | null> {
  const keywords = extractKeywords(query);
  if (keywords.length === 0) return { entries: [], keywords: [] };

  try {
    const supabase = createAdminClient();
    const orFilter = keywords
      .flatMap((k) => [`title.ilike.%${k}%`, `body.ilike.%${k}%`])
      .join(",");

    const { data, error } = await supabase
      .from("entry")
      .select("id, title, body, library:library_id(key, name, group_key)")
      .neq("status", "archived")
      .or(orFilter)
      .limit(50);

    if (error) return null;

    type Row = {
      id: string;
      title: string;
      body: string;
      library: { key: string; name: string; group_key: string } | null;
    };

    const rows = (data ?? []) as unknown as Row[];

    const scored = rows
      .filter((r) => r.library)
      .map((r) => {
        const haystack = `${r.title} ${r.body}`.toLowerCase();
        const score = keywords.reduce(
          (sum, k) => sum + (haystack.includes(k) ? 1 : 0),
          0,
        );
        return { row: r, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const entries: SearchResultEntry[] = scored.map(({ row }) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      libraryKey: row.library!.key,
      libraryName: row.library!.name,
      groupKey: row.library!.group_key,
    }));

    return { entries, keywords };
  } catch {
    return null;
  }
}

export async function logSearchQuery(
  queryText: string,
  answer: string | null,
  retrievedEntryIds: string[],
  createdBy: string | null,
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase.from("ai_search_query").insert({
      query_text: queryText,
      answer,
      retrieved_entry_ids: retrievedEntryIds,
      created_by: createdBy,
    });
  } catch {
    // Logging is best-effort; never block the user's answer on it.
  }
}
