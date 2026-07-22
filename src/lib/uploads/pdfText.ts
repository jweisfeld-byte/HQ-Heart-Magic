import { PDFParse } from "pdf-parse";

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
 */
export async function extractPdfTextFromUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const contentLength = Number(res.headers.get("content-length") ?? "0");
    if (contentLength > MAX_EXTRACT_INPUT_BYTES) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > MAX_EXTRACT_INPUT_BYTES) return null;

    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();
    await parser.destroy?.();

    const text = result.text?.trim();
    if (!text) return null;

    return text.length > MAX_EXTRACTED_CHARS ? text.slice(0, MAX_EXTRACTED_CHARS) : text;
  } catch {
    return null;
  }
}
