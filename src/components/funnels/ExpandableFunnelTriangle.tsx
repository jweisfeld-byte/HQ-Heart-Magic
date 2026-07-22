"use client";

import { useState } from "react";
import { FunnelTriangle, type FunnelTriangleStage } from "@/components/funnels/FunnelTriangle";

const SIZES = {
  normal: "max-w-lg",
  expanded: "max-w-4xl",
};

// Just a client-side width toggle — FunnelTriangle itself has no fixed
// max-width anymore, so "Expand" is literally widening this wrapper;
// the SVG's viewBox scales up with it, formats and all (Jacob's ask).
export function ExpandableFunnelTriangle({ stages }: { stages: FunnelTriangleStage[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className={`w-full transition-all duration-200 ${expanded ? SIZES.expanded : SIZES.normal}`}>
        <FunnelTriangle stages={stages} />
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-accent/5"
      >
        {expanded ? "Collapse" : "Expand"}
      </button>
    </div>
  );
}
