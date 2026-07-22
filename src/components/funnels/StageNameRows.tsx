"use client";

import { useState } from "react";

// Simple repeatable text-input rows for naming a new funnel's stages
// up front (Awareness/Interest/Decision/Action by default) — plain
// named "stageName" inputs read server-side via formData.getAll, same
// convention as ReferencesEditor's rows. No Drive picking here; that
// happens per-stage after the funnel exists, on the detail page.
export function StageNameRows({ initial }: { initial: string[] }) {
  const [rows, setRows] = useState<string[]>(initial);

  function update(index: number, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? value : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, ""]);
  }

  function removeRow(index: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  return (
    <div>
      <label className="text-sm font-medium text-foreground">
        Stages (top of the funnel to the bottom)
      </label>
      <div className="mt-1 flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 text-xs text-muted">{i + 1}.</span>
            <input
              name="stageName"
              value={row}
              onChange={(e) => update(i, e.target.value)}
              placeholder="e.g. Awareness"
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="rounded-lg border border-border px-3 text-sm text-muted hover:bg-accent/5"
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
