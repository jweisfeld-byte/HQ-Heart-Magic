// Bounded per the same cost-discipline used everywhere else in this app
// (getAdAccountInsightsSummary, chat snapshot, etc.): skip rather than
// risk a slow/oversized serverless invocation on a huge PDF, and cap
// how much text we persist per document.
const MAX_EXTRACT_INPUT_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_EXTRACTED_CHARS = 20000;

/**
 * Downloads a PDF (from HQ's own Supabase Storage — only ever called
 * for target_type = 'upload' references, see setReferencesForEntry) and
 * extracts its text so AI Search and the HQ Assistant can actually
 * answer questions about what's inside it, not just its filename.
 * Best-effort: any failure (fetch, parse, oversized file) returns null
 * rather than blocking the entry/reference save.
 *
 * IMPORTANT: uses `unpdf` instead of `pdf-parse`. pdf-parse pulls in
 * pdfjs-dist's Node build, which references browser-only globals
 * (DOMMatrix/ImageData/Path2D) and only works if a native canvas
 * package is present in the deployed serverless function — Vercel's
 * build tracing doesn't reliably include that native binary even when
 * explicitly installed and marked as a serverExternalPackage, so every
 * extraction attempt threw "ReferenceError: DOMMatrix is not defined"
 * in production despite working locally. unpdf ships a purpose-built
 * serverless bundle of PDF.js with zero native dependencies — designed
 * exactly for this (Cloudflare Workers, Vercel, etc.) — so there's
 * nothing for the build tracer to drop.
 *
 * Still dynamically imported (not a static top-of-file import) so this
 * module is only loaded when a PDF reference is actually saved, not on
 * every request to every route that transitively imports this file via
 * knowledge/queries.ts.
 */
export async function extractPdfTextFromUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const contentLength = Number(res.headers.get("content-length") ?? "0");
    if (contentLength > MAX_EXTRACT_INPUT_BYTES) return null;

    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > MAX_EXTRACT_INPUT_BYTES) return null;

    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(buf);
    const { text } = await extractText(pdf, { mergePages: true });

    const trimmed = text?.trim();
    if (!trimmed) {
      console.error("extractPdfTextFromUrl: unpdf returned no text for", url);
      return null;
    }

    return trimmed.length > MAX_EXTRACTED_CHARS ? trimmed.slice(0, MAX_EXTRACTED_CHARS) : trimmed;
  } catch (err) {
    // Logged so we can actually see why extraction failed instead of it
    // just silently degrading to "no extracted text" with no trace.
    console.error("extractPdfTextFromUrl: failed for", url, err);
    return null;
  }
}
