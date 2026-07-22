"use client";

import { useState } from "react";

export type StageRow = { name: string; strategy: string };

// Repeatable name+strategy rows for scaffolding a new funnel's stages
// up front — defaults to Jacob's reference 5-stage awareness model
// (Unaware -> Most Aware), fully editable/removable/addable. Plain
// named "stageName"/"stageStrategy" inputs read server-side via
// formData.getAll (parallel arrays), same convention as
// ReferencesEditor's rows. No Drive picking here; formats get attached
// per-stage after the funnel exists, on the detail page.
export function StageRows({ initial }: { initial: StageRow[] }) {
  const [rows, setRows] = useState<StageRow[]>(initial);

  function update(index: number, field: "name" | "strategy", value: string) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { name: "", strategy: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  return (
    <div>
      <label className="text-sm font-medium text-foreground">
        Stages (top of the funnel to the bottom)
      </label>
      <div className="mt-1 flex flex-col gap-3">
        {rows.map((row, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-2 w-5 text-xs text-muted">{i + 1}.</span>
            <div className="flex-1 flex flex-col gap-1">
              <input
                value={row.name}
                onChange={(e) => update(i, "name", e.target.value)}
                placeholder="e.g. Unaware"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground"
              />
              <input
                value={row.strategy}
                onChange={(e) => update(i, "strategy", e.target.value)}
                placeholder="Creative strategy for this stage — e.g. reveal a problem they didn't know they had"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground"
              />
              {/* Hidden inputs carry the actual submitted values, so
                  removing a row doesn't leave a gap in the arrays. */}
              <input type="hidden" name="stageName" value={row.name} readOnly />
              <input type="hidden" name="stageStrategy" value={row.strategy} readOnly />
            </div>
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="mt-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:bg-accent/5"
              aria-label="Remove stage"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addRow} className="mt-2 text-sm text-accent hover:underline">
        + Add another stage
      </button>
    </div>
  );
}
