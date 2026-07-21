"use client";

import { useState } from "react";

export type ReferenceRow = { label: string; url: string };

// Repeatable label+url rows, rendered as plain named inputs inside the
// surrounding <form>. No client-side submit logic here — the browser's
// native form submission carries every "referenceLabel"/"referenceUrl"
// input through as parallel arrays, read on the server with
// formData.getAll(). This is the Reference model (Knowledge Graph v1
// Section 4) — one entry, many linked docs (Drive, articles, etc.).
export function ReferencesEditor({ initial }: { initial: ReferenceRow[] }) {
  const [rows, setRows] = useState<ReferenceRow[]>(
    initial.length > 0 ? initial : [{ label: "", url: "" }],
  );

  function update(index: number, field: keyof ReferenceRow, value: string) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { label: "", url: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev,
    );
  }

  return (
    <div>
      <label className="text-sm font-medium text-foreground">
        Linked documents (optional — Google Drive, etc.)
      </label>
      <div className="mt-1 flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2">
            <input
              name="referenceLabel"
              value={row.label}
              onChange={(e) => update(i, "label", e.target.value)}
              placeholder="Label, e.g. Ingredient Spec Sheet"
              className="w-2/5 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
            <input
              name="referenceUrl"
              type="url"
              value={row.url}
              onChange={(e) => update(i, "url", e.target.value)}
              placeholder="https://drive.google.com/..."
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="rounded-lg border border-border px-3 text-sm text-muted hover:bg-accent/5"
              aria-label="Remove document"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-2 text-sm text-accent hover:underline"
      >
        + Add another document
      </button>
    </div>
  );
}
