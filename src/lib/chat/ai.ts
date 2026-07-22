import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "./queries";

const MODEL = "claude-sonnet-5";

// Only the last dozen turns go to the model — the widget keeps a longer
// visible history (see getChatHistory), but capping what's actually
// sent bounds the cost of every single message rather than growing
// unbounded over a long-running conversation.
const MAX_HISTORY_MESSAGES = 12;

/**
 * Read-only HQ assistant — Jacob confirmed Q&A only (no actions) for
 * this first version. Same grounded-synthesis discipline as AI Search
 * and the dashboard recommendations: reasons only over the snapshot
 * actually passed in, and says so plainly when something isn't in
 * there rather than guessing or reaching outside HQ's own data.
 */
export async function generateChatReply(
  history: ChatMessage[],
  snapshot: string,
  question: string,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });

  const recentHistory = history.slice(-MAX_HISTORY_MESSAGES);

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system:
        "You are the internal assistant inside Heart Magic HQ, a company's own operations app. " +
        "You answer questions using ONLY the HQ snapshot provided below — tasks, projects, marketing " +
        "funnels (with ad copy and Meta ad performance where linked), wholesale accounts, events, and " +
        "any matched Knowledge/Marketing/Creative/Creators/Analytics/Experiments entries. " +
        "You are read-only: you never take actions, never claim to have created or changed anything, " +
        "and if someone asks you to do something (create a task, edit a funnel, etc.), tell them plainly " +
        "you can only answer questions right now and they should do it themselves in HQ. " +
        "Never invent data that isn't in the snapshot — if something isn't there, say so plainly rather " +
        "than guessing. Be direct and concise. Use the actual snapshot data (names, numbers, dates) " +
        "rather than vague generalities.\n\n" +
        `--- HQ SNAPSHOT ---\n${snapshot}`,
      messages: [
        ...recentHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: "user" as const, content: question },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock && "text" in textBlock ? textBlock.text : null;
  } catch {
    return null;
  }
}
