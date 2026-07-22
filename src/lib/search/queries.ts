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

type EntryRow = {
  id: string;
  title: string;
  body: string;
  library: { key: string; name: string; group_key: string } | null;
};

// Bulk-fetches extracted PDF text (see reference.extracted_text,
// populated by setReferencesForEntry/extractPdfTextFromUrl) for a set of
// entry ids, keyed by entry id, so a linked document's actual content —
// not just its filename — counts toward both search matching and what
// gets shown to Claude. One query regardless of how many entries.
async function getExtractedTextByEntryId(
  supabase: ReturnType<typeof createAdminClient>,
  entryIds: string[],
): Promise<Record<string, { label: string; text: string }[]>> {
  if (entryIds.length === 0) return {};

  const { data, error } = await supabase
    .from("reference")
    .select("entry_id, label, extracted_text")
    .in("entry_id", entryIds)
    .not("extracted_text", "is", null);

  if (error || !data) return {};

  const map: Record<string, { label: string; text: string }[]> = {};
  for (const row of data as { entry_id: string; label: string; extracted_text: string }[]) {
    if (!row.extracted_text) continue;
    (map[row.entry_id] ??= []).push({ label: row.label, text: row.extracted_text });
  }
  return map;
}

/**
 * Plain keyword search (no embeddings/semantic search yet — AI Search v1
 * doc, Section 3 flags that as future work) across every entry in the
 * generic Content Module engine, PLUS the extracted text of any linked
 * PDF documents (Jacob's ask: the assistant should be able to read what's
 * actually inside a linked document, not just match its filename).
 * Extracts keywords from a natural-language question, matches any of
 * them against title/body/attached-document text, then ranks results in
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
    const entrySelect = "id, title, body, library:library_id(key, name, group_key)";

    const titleBodyFilter = keywords
      .flatMap((k) => [`title.ilike.%${k}%`, `body.ilike.%${k}%`])
      .join(",");

    const { data: titleBodyRows, error: titleBodyError } = await supabase
      .from("entry")
      .select(entrySelect)
      .neq("status", "archived")
      .or(titleBodyFilter)
      .limit(50);

    if (titleBodyError) return null;

    // Second pass: any entry whose linked PDF text matches a keyword,
    // even if its own title/body didn't — otherwise a document's actual
    // content would be invisible to search entirely.
    const extractedFilter = keywords
      .map((k) => `extracted_text.ilike.%${k}%`)
      .join(",");
    const { data: matchedRefs } = await supabase
      .from("reference")
      .select("entry_id")
      .not("extracted_text", "is", null)
      .or(extractedFilter)
      .limit(50);

    const rows = ((titleBodyRows ?? []) as unknown as EntryRow[]).filter((r) => r.library);
    const seenIds = new Set(rows.map((r) => r.id));
    const extraIds = Array.from(
      new Set(
        ((matchedRefs ?? []) as { entry_id: string }[])
          .map((r) => r.entry_id)
          .filter((id) => !seenIds.has(id)),
      ),
    );

    if (extraIds.length > 0) {
      const { data: extraRows } = await supabase
        .from("entry")
        .select(entrySelect)
        .neq("status", "archived")
        .in("id", extraIds);
      for (const r of ((extraRows ?? []) as unknown as EntryRow[]).filter((r) => r.library)) {
        rows.push(r);
      }
    }

    const extractedByEntryId = await getExtractedTextByEntryId(
      supabase,
      rows.map((r) => r.id),
    );

    const scored = rows
      .map((r) => {
        const docText = (extractedByEntryId[r.id] ?? []).map((d) => d.text).join(" ");
        const haystack = `${r.title} ${r.body} ${docText}`.toLowerCase();
        const score = keywords.reduce(
          (sum, k) => sum + (haystack.includes(k) ? 1 : 0),
          0,
        );
        return { row: r, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const entries: SearchResultEntry[] = scored.map(({ row }) => {
      const docs = extractedByEntryId[row.id] ?? [];
      const docLines = docs.map(
        (d) => "[Attached document \"" + d.label + "\"]\n" + d.text,
      );
      const body = docs.length
        ? (row.body + "\n\n" + docLines.join("\n\n")).trim()
        : row.body;

      return {
        id: row.id,
        title: row.title,
        body,
        libraryKey: row.library!.key,
        libraryName: row.library!.name,
        groupKey: row.library!.group_key,
      };
    });

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
