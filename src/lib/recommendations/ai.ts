import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-5";

export type PersonContext = {
  name: string;
  focusArea: string;
  openTasks: { title: string; status: string; dueDate: string | null }[];
  projects: { name: string; percentDone: number | null }[];
};

export type BusinessSnapshot = {
  conversionRateText: string;
  todaySalesText: string;
  salesLast30DaysText: string;
  lowInventoryText: string;
};

// Same grounded-synthesis discipline as AI Search's synthesizeAnswer:
// only reasons over the data actually passed in, and is told to say so
// plainly rather than invent a recommendation when the data's too thin.
export async function generateRevenueRecommendation(
  person: PersonContext,
  business: BusinessSnapshot,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const taskLines = person.openTasks.length
    ? person.openTasks
        .map(
          (t) =>
            `- "${t.title}" (${t.status}${t.dueDate ? `, due ${t.dueDate}` : ", no due date"})`,
        )
        .join("\n")
    : "(no open tasks assigned)";

  const projectLines = person.projects.length
    ? person.projects
        .map(
          (p) =>
            `- ${p.name}${p.percentDone !== null ? ` (${p.percentDone}% of tasks done)` : ""}`,
        )
        .join("\n")
    : "(not assigned to any projects)";

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 300,
      system:
        "You are an internal ops assistant for Heart Magic, a small ceremonial cacao / functional mushroom DTC brand. " +
        "Given one team member's role focus, their currently open tasks/projects, and today's store numbers, " +
        "recommend the ONE most revenue-impactful action they should take today. " +
        "Ground your answer ONLY in the data given — reference a specific task, project, or number where relevant. " +
        "If the data genuinely doesn't support a strong recommendation (e.g. no open tasks and flat numbers), say so plainly rather than inventing one. " +
        "Be direct: 2-4 sentences, no preamble, no bullet points, no restating these instructions.",
      messages: [
        {
          role: "user",
          content:
            `Team member: ${person.name}\n` +
            `Role focus: ${person.focusArea}\n\n` +
            `Their open tasks:\n${taskLines}\n\n` +
            `Their projects:\n${projectLines}\n\n` +
            `Today's store numbers:\n` +
            `- Conversion rate: ${business.conversionRateText}\n` +
            `- Sales today: ${business.todaySalesText}\n` +
            `- Sales, trailing 30 days: ${business.salesLast30DaysText}\n` +
            `- Inventory: ${business.lowInventoryText}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock && "text" in textBlock ? textBlock.text : null;
  } catch {
    return null;
  }
}
