import {
  getLibraryByKey,
  getEntryTypesForLibrary,
  getEntriesForLibrary,
} from "@/lib/knowledge/queries";
import { getQuoteOfTheDay } from "@/lib/quotes";

/**
 * Builds the weekly message posted to Discord — this goes out to
 * Jacob's CREATORS community, not the internal team, so it deliberately
 * contains no sales/conversion/ad-spend numbers (that's what the first
 * version of this did, before Jacob clarified the audience). Instead it
 * pulls whatever's currently PUBLISHED in Marketing > Meta Ads as an Ad
 * Angle or Ad Creative Brief — the actual direction Jacob wants
 * creators focusing content on that week — plus the same manifesting/
 * dreams-themed quote already on the HQ dashboard.
 *
 * Only status = 'published' entries are ever included (the entry form
 * defaults to 'draft' until someone explicitly publishes it), so a
 * half-written brief never accidentally goes out to creators.
 */
export async function buildWeeklyDigestMessage(): Promise<string> {
  const library = await getLibraryByKey("meta-ads");
  let angle: string | null = null;
  let brief: string | null = null;

  if (library) {
    const entryTypes = await getEntryTypesForLibrary(library.id);
    const angleType = entryTypes.find((t) => t.key === "ad-angle");
    const briefType = entryTypes.find((t) => t.key === "ad-creative-brief");

    if (angleType) {
      const entries = await getEntriesForLibrary(library.id, { entryTypeId: angleType.id });
      const latest = entries?.find((e) => e.status === "published");
      if (latest) angle = `**${latest.title}**\n${latest.body.trim()}`;
    }

    if (briefType) {
      const entries = await getEntriesForLibrary(library.id, { entryTypeId: briefType.id });
      const latest = entries?.find((e) => e.status === "published");
      if (latest) brief = `**${latest.title}**\n${latest.body.trim()}`;
    }
  }

  const lines: string[] = ["**This Week's Content Direction** 🌿✨"];

  if (angle) {
    lines.push(`**This week's angle:**\n${angle}`);
  }
  if (brief) {
    lines.push(`**Creative brief:**\n${brief}`);
  }
  if (!angle && !brief) {
    lines.push(
      "No content angle or brief has been published yet this week — check back soon, or reach out if you want direction in the meantime!",
    );
  }

  const quote = getQuoteOfTheDay();
  lines.push(`\n_"${quote.text}"_ — ${quote.author}`);
  lines.push("\nGrateful for this community — keep manifesting incredible content! 🍫");

  return lines.join("\n");
}
