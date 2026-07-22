import { getSalesLastNDays, getConversionRateLastWeek } from "@/lib/shopify/queries";
import { getAdAccountInsightsSummary } from "@/lib/meta/queries";
import { getTasks } from "@/lib/tasks/queries";

/**
 * Builds the weekly-results message posted to Discord (Jacob's ask:
 * automate weekly-results messages to his Discord communities). Kept
 * well under Discord's 2000-character message limit — capped to the
 * top 3 ads and a completed-task count rather than a full list, same
 * "bounded, not exhaustive" discipline used in the HQ Assistant's
 * snapshot builder.
 */
export async function buildWeeklyDigestMessage(): Promise<string> {
  const [sales, conversion, adInsights, tasks] = await Promise.all([
    getSalesLastNDays(7),
    getConversionRateLastWeek(),
    getAdAccountInsightsSummary(3, "last_7d"),
    getTasks(),
  ]);

  const lines: string[] = ["**This Week at Heart Magic** 🌿✨"];

  if (sales) {
    lines.push(
      `**Sales:** ${sales.orderCount} orders, $${sales.totalRevenue.toFixed(2)} ${sales.currency} in revenue.`,
    );
  } else {
    lines.push("**Sales:** not available right now.");
  }

  if (conversion) {
    lines.push(
      `**Conversion rate:** ${conversion.conversionRate.toFixed(2)}% (${conversion.completedCheckouts} of ${conversion.sessions} sessions).`,
    );
  }

  if (tasks) {
    const now = Date.now();
    const completedThisWeek = tasks.filter(
      (t) =>
        t.status === "done" &&
        now - new Date(t.updated_at).getTime() <= 7 * 24 * 60 * 60 * 1000,
    ).length;
    lines.push(`**Tasks completed:** ${completedThisWeek} this week.`);
  }

  if (adInsights && "ads" in adInsights && adInsights.ads.length > 0) {
    const topLines = adInsights.ads
      .slice(0, 3)
      .map((a) => `• "${a.name}" — $${a.spend.toFixed(2)} spend, ${a.ctr.toFixed(2)}% CTR`);
    lines.push(`**Top Meta ads this week:**\n${topLines.join("\n")}`);
  }

  lines.push("\nGrateful for this community — here's to manifesting an even bigger week ahead. 🍫");

  return lines.join("\n");
}
