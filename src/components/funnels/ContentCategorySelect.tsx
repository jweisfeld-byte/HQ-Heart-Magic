"use client";

import {
  CONTENT_CATEGORIES,
  CONTENT_CATEGORY_LABELS,
  type ContentCategory,
} from "@/lib/funnels/queries";

// Auto-submits on change, same pattern as StageSelect (Wholesale) — a
// dropdown per format tagging it UGC / Brand Made / AI, so a stage's
// formats can be checked for an even split across the three.
export function ContentCategorySelect({
  id,
  funnelId,
  category,
  action,
}: {
  id: string;
  funnelId: string;
  category: ContentCategory | null;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="funnelId" value={funnelId} />
      <select
        name="contentCategory"
        defaultValue={category ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground"
      >
        <option value="">— category —</option>
        {CONTENT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CONTENT_CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
    </form>
  );
}
