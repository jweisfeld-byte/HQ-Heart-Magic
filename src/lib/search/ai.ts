import Anthropic from "@anthropic-ai/sdk";
import type { SearchResultEntry } from "./queries";

const MODEL = "claude-sonnet-5";
const MAX_BODY_CHARS = 1200;

/**
 * Retrieval-augmented synthesis, AI Search v1 doc Section 1 step 4 —
 * receives ONLY the retrieved entries (never the whole graph), and is
 * instructed never to answer beyond what was actually retrieved. Returns
 * null if ANTHROPIC_API_KEY isn't configured yet, so the page can fall
 * back to just listing the matched entries without a synthesized answer.
 */
export async function synthesizeAnswer(
  question: string,
  entries: SearchResultEntry[],
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || entries.length === 0) return null;

  const context = entries
    .map(
      (e, i) =>
        `[${i + 1}] "${e.title}" (${e.libraryName})\n${e.body.slice(0, MAX_BODY_CHARS)}`,
    )
    .join("\n\n---\n\n");

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system:
        "You answer questions about a company's internal knowledge base using ONLY the numbered source excerpts provided below. " +
        "Never use outside knowledge and never invent a plausible-sounding answer. " +
        "If the sources don't actually contain an answer, say plainly what's missing rather than guessing. " +
        "When you state something a source supports, refer to it by its bracketed number, e.g. [1]. " +
        "Be direct and concise — a few sentences, not an essay.",
      messages: [
        {
          role: "user",
          content: `Question: ${question}\n\nSources:\n\n${context}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock && "text" in textBlock ? textBlock.text : null;
  } catch (err) {
    console.error("synthesizeAnswer: Claude API call failed", err);
    return null;
  }
}
