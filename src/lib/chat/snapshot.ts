import { getTasks, STATUS_LABELS, type Task } from "@/lib/tasks/queries";
import { getProjects } from "@/lib/projects/queries";
import {
  getFunnels,
  getFunnelStages,
  getAssetsForStages,
} from "@/lib/funnels/queries";
import { getAdInsights, getAdAccountInsightsSummary } from "@/lib/meta/queries";
import { getWholesaleAccounts, STAGE_LABELS } from "@/lib/wholesale/queries";
import { getEvents } from "@/lib/events/queries";
import { searchEntries } from "@/lib/search/queries";

/**
 * Assembles a bounded, text-only snapshot of "everything in HQ" for the
 * chat widget to reason over — Jacob's ask: an assistant that can pull
 * from all of HQ to inform decisions, not just the Knowledge-style
 * entries the older AI Search feature covers.
 *
 * Deliberately bounded (per-section caps, truncated text, at most a
 * handful of live Meta insights calls) rather than dumping the entire
 * database — this runs on every chat message, so an unbounded snapshot
 * would be slow and expensive. Knowledge/Marketing/Creative/Creators/
 * Analytics/Experiments entries are pulled via the same keyword
 * retrieval AI Search already uses (searchEntries), scoped to whatever
 * the person just asked, rather than included wholesale.
 */
export async function buildHqSnapshot(question: string): Promise<string> {
  const sections: string[] = [];

  const [tasks, projects, funnels, wholesaleAccounts, events, searchResult] =
    await Promise.all([
      getTasks(),
      getProjects(),
      getFunnels(),
      getWholesaleAccounts(),
      getEvents(),
      searchEntries(question, 8),
    ]);

  // --- Tasks -------------------------------------------------------
  if (tasks && tasks.length > 0) {
    const notDone = tasks
      .filter((t) => t.status !== "done")
      .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
      .slice(0, 40);

    const recentlyDone = tasks
      .filter((t) => t.status === "done")
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 15);

    const line = (t: Task) =>
      `- "${t.title}" [${STATUS_LABELS[t.status]}]${t.assignee_email ? ` — ${t.assignee_email}` : " — unassigned"}${t.due_date ? `, due ${t.due_date}` : ""}${t.recurrence ? `, repeats ${t.recurrence}` : ""}`;

    sections.push(
      `TASKS (open/in-progress, ${notDone.length} shown):\n${notDone.map(line).join("\n") || "(none)"}\n\nRecently completed (${recentlyDone.length} shown):\n${recentlyDone.map(line).join("\n") || "(none)"}`,
    );
  } else {
    sections.push("TASKS: none recorded, or Tasks isn't set up yet.");
  }

  // --- Projects ------------------------------------------------------
  if (projects && projects.length > 0) {
    const projectLines = projects.map((p) => {
      const projectTasks = (tasks ?? []).filter((t) => t.project_id === p.id);
      const percentDone =
        projectTasks.length > 0
          ? Math.round(
              (projectTasks.filter((t) => t.status === "done").length /
                projectTasks.length) *
                100,
            )
          : null;
      return `- "${p.name}"${percentDone !== null ? ` — ${percentDone}% done` : " — no tasks logged yet"}, assignees: ${p.assignee_emails.join(", ") || "none"}`;
    });
    sections.push(`PROJECTS:\n${projectLines.join("\n")}`);
  } else {
    sections.push("PROJECTS: none recorded, or Projects isn't set up yet.");
  }

  // --- Funnels (stages, formats, ad copy, linked Meta ad) -----------
  if (funnels && funnels.length > 0) {
    const funnelLines: string[] = [];
    let insightsCallsUsed = 0;
    const MAX_INSIGHTS_CALLS = 5;

    for (const funnel of funnels.slice(0, 10)) {
      const stages = (await getFunnelStages(funnel.id)) ?? [];
      const assetsByStage = await getAssetsForStages(stages.map((s) => s.id));
      const stageLines: string[] = [];

      for (const stage of stages) {
        const assets = assetsByStage[stage.id] ?? [];
        if (assets.length === 0) {
          stageLines.push(`  · ${stage.name}: no formats built out yet`);
          continue;
        }
        for (const asset of assets) {
          let metaLine = "";
          if (asset.meta_ad_id && insightsCallsUsed < MAX_INSIGHTS_CALLS) {
            insightsCallsUsed++;
            const insights = await getAdInsights(asset.meta_ad_id);
            metaLine = insights
              ? ` | linked Meta ad "${asset.meta_ad_name}" — last 30d: $${insights.spend.toFixed(2)} spend, ${insights.impressions.toLocaleString()} impressions, ${insights.clicks.toLocaleString()} clicks, ${insights.ctr.toFixed(2)}% CTR`
              : ` | linked to Meta ad "${asset.meta_ad_name}" (metrics unavailable right now)`;
          } else if (asset.meta_ad_id) {
            metaLine = ` | linked to Meta ad "${asset.meta_ad_name}"`;
          }
          const copy = asset.ad_copy?.trim()
            ? ` | ad copy: "${asset.ad_copy.trim().slice(0, 200)}"`
            : "";
          stageLines.push(
            `  · ${stage.name} — "${asset.label}"${asset.file_url ? " (asset attached)" : " (no asset attached)"}${copy}${metaLine}`,
          );
        }
      }

      funnelLines.push(
        `- "${funnel.name}"${funnel.description ? `: ${funnel.description}` : ""}\n${stageLines.join("\n")}`,
      );
    }

    sections.push(`MARKETING FUNNELS:\n${funnelLines.join("\n\n")}`);
  } else {
    sections.push("MARKETING FUNNELS: none recorded, or Funnels isn't set up yet.");
  }

  // --- Meta Ads account overview (independent of funnel linking) ---
  // Jacob's ask: the assistant should be able to answer ad-performance
  // questions even for ads that haven't been linked to a funnel format
  // yet, using one bulk account-level API call rather than depending on
  // manual per-format linking (that path is handled separately above,
  // inside MARKETING FUNNELS, for whichever ads ARE linked).
  const accountInsights = await getAdAccountInsightsSummary(15);
  if (accountInsights && "ads" in accountInsights) {
    if (accountInsights.ads.length > 0) {
      const lines = accountInsights.ads.map(
        (a) =>
          `- "${a.name}" — $${a.spend.toFixed(2)} spend, ${a.impressions.toLocaleString()} impressions, ${a.clicks.toLocaleString()} clicks, ${a.ctr.toFixed(2)}% CTR`,
      );
      sections.push(
        `META ADS ACCOUNT OVERVIEW (last 30 days, top ${accountInsights.ads.length} ads by spend, account-wide totals: $${accountInsights.totals.spend.toFixed(2)} spend / ${accountInsights.totals.impressions.toLocaleString()} impressions / ${accountInsights.totals.clicks.toLocaleString()} clicks):\n${lines.join("\n")}`,
      );
    } else {
      sections.push(
        "META ADS ACCOUNT OVERVIEW: connected, but no ad activity in the last 30 days.",
      );
    }
  } else if (accountInsights && "error" in accountInsights) {
    sections.push(`META ADS ACCOUNT OVERVIEW: ${accountInsights.error}`);
  } else {
    sections.push("META ADS ACCOUNT OVERVIEW: Meta Ads isn't connected yet — see Settings > Integrations.");
  }

  // --- Wholesale -----------------------------------------------------
  if (wholesaleAccounts && wholesaleAccounts.length > 0) {
    const lines = wholesaleAccounts
      .slice(0, 30)
      .map(
        (a) =>
          `- ${a.company_name} [${STAGE_LABELS[a.stage]}]${a.contact_name ? `, contact ${a.contact_name}` : ""}${a.next_follow_up_at ? `, next follow-up ${a.next_follow_up_at}` : ""}`,
      );
    sections.push(`WHOLESALE ACCOUNTS:\n${lines.join("\n")}`);
  } else {
    sections.push("WHOLESALE ACCOUNTS: none recorded, or Wholesale isn't set up yet.");
  }

  // --- Events ----------------------------------------------------------
  if (events && events.length > 0) {
    const now = Date.now();
    const upcoming = events
      .filter((e) => {
        const t = new Date(e.event_date).getTime();
        return t >= now - 30 * 24 * 60 * 60 * 1000; // include recent-past + future
      })
      .slice(0, 20);
    const lines = upcoming.map(
      (e) =>
        `- "${e.title}" on ${e.event_date}${e.point_of_contact ? `, POC: ${e.point_of_contact}` : ""}`,
    );
    sections.push(`EVENTS (recent + upcoming):\n${lines.join("\n") || "(none)"}`);
  } else {
    sections.push("EVENTS: none recorded, or Events isn't set up yet.");
  }

  // --- Knowledge/Marketing/Creative/Creators/Analytics/Experiments ----
  if (searchResult && searchResult.entries.length > 0) {
    const lines = searchResult.entries.map(
      (e, i) => `[${i + 1}] "${e.title}" (${e.libraryName})\n${e.body.slice(0, 800)}`,
    );
    sections.push(
      `RELEVANT KNOWLEDGE / MARKETING / CREATIVE / CREATORS / ANALYTICS / EXPERIMENTS ENTRIES (matched to the question):\n${lines.join("\n\n")}`,
    );
  } else {
    sections.push(
      "RELEVANT KNOWLEDGE ENTRIES: nothing matched this question in Knowledge, Marketing, Creative, Creators, Analytics, or Experiments.",
    );
  }

  return sections.join("\n\n---\n\n");
}
