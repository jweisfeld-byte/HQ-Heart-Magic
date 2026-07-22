import type { FunnelStage } from "@/lib/funnels/queries";

type Point = readonly [number, number];

function normalize([x, y]: Point): Point {
  const len = Math.hypot(x, y) || 1;
  return [x / len, y / len];
}

// Rounds every corner of a closed polygon by a fixed radius — same
// technique as ProjectPyramid's rounded pyramid corners, reused here
// so the funnel's outer silhouette (apex tip, base-left, base-right)
// stays rounded regardless of how many stages divide it.
function roundedPolygonPath(points: Point[], radius: number): string {
  const n = points.length;
  const commands: string[] = [];

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    const inDir = normalize([curr[0] - prev[0], curr[1] - prev[1]]);
    const outDir = normalize([next[0] - curr[0], next[1] - curr[1]]);

    const p1: Point = [curr[0] - inDir[0] * radius, curr[1] - inDir[1] * radius];
    const p2: Point = [curr[0] + outDir[0] * radius, curr[1] + outDir[1] * radius];

    commands.push(i === 0 ? `M ${p1[0]} ${p1[1]}` : `L ${p1[0]} ${p1[1]}`);
    commands.push(`Q ${curr[0]} ${curr[1]} ${p2[0]} ${p2[1]}`);
  }
  commands.push("Z");
  return commands.join(" ");
}

const BAND_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

// A big triangle, wide end at top (top of funnel) narrowing to a tip
// at the bottom (the conversion) — one horizontal band per stage, in
// the order stages were added. Each band is colored in once it has a
// Google Drive asset attached; empty stages render as a dashed, empty
// band so it's obvious what still needs an asset built out. Bands are
// sized by `size_percent` when set, otherwise split evenly, mirroring
// how the Projects pyramid handles unset percentages.
export function FunnelTriangle({
  stages,
  size = "large",
}: {
  stages: FunnelStage[];
  size?: "large" | "small";
}) {
  const n = stages.length;

  if (n === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted">
        No stages in this funnel yet.
      </div>
    );
  }

  const anySet = stages.some((s) => s.size_percent !== null);
  const sum = stages.reduce((total, s) => total + (s.size_percent ?? 0), 0);
  const useEqualSplit = !anySet || sum <= 0;
  const shares = stages.map((s) =>
    useEqualSplit ? 1 / n : (s.size_percent ?? 0) / sum,
  );

  const isSmall = size === "small";
  const apexX = isSmall ? 80 : 150;
  const baseHalfWidth = isSmall ? 70 : 130;
  const apexY = isSmall ? 10 : 20;
  const rowHeight = isSmall ? 16 : 26;
  const height = Math.max(isSmall ? 100 : 160, n * rowHeight + (isSmall ? 20 : 40));
  const baseY = height - (isSmall ? 10 : 20);
  const labelAreaWidth = isSmall ? 0 : 220;
  const width = apexX + baseHalfWidth + labelAreaWidth;

  const widthAtFraction = (f: number) => f * baseHalfWidth * 2;
  const yAtFraction = (f: number) => apexY + f * (baseY - apexY);

  // stages[0] is the top of the funnel (widest); stages[n-1] is the
  // bottom (the tip) — the reverse of the Projects pyramid's
  // bottom-to-top ordering, since a funnel's "first stage" (Awareness)
  // reads at the top, not the base.
  const bounds = shares.reduce<{ list: (readonly [number, number])[]; total: number }>(
    (acc, share) => {
      const f0 = acc.total;
      const f1 = f0 + share;
      return { list: [...acc.list, [f0, f1] as const], total: f1 };
    },
    { list: [], total: 0 },
  ).list;

  const bands = stages.map((stage, index) => {
    const [f0, f1] = bounds[index];

    const topWidth = widthAtFraction(f0);
    const bottomWidth = widthAtFraction(f1);
    const topY = yAtFraction(f0);
    const bottomY = yAtFraction(f1);

    const path = [
      `M ${apexX - topWidth / 2} ${topY}`,
      `L ${apexX + topWidth / 2} ${topY}`,
      `L ${apexX + bottomWidth / 2} ${bottomY}`,
      `L ${apexX - bottomWidth / 2} ${bottomY}`,
      "Z",
    ].join(" ");

    const midF = (f0 + f1) / 2;
    const midY = yAtFraction(midF);
    const rightEdge = apexX + widthAtFraction(midF) / 2;
    const color = BAND_COLORS[index % BAND_COLORS.length];
    const hasFile = Boolean(stage.drive_file_id || stage.file_url);

    return { stage, path, midY, rightEdge, color, hasFile };
  });

  const clipId = `funnel-clip-${stages.map((s) => s.id).join("-") || "empty"}-${size}`;
  const cornerRadius = isSmall ? 6 : 10;
  const clipPath = roundedPolygonPath(
    [
      [apexX, baseY],
      [apexX - baseHalfWidth, apexY],
      [apexX + baseHalfWidth, apexY],
    ],
    cornerRadius,
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={isSmall ? "h-auto w-full max-w-[160px] text-foreground" : "h-auto w-full max-w-lg text-foreground"}
      role="img"
      aria-label={`Funnel with ${n} stage${n === 1 ? "" : "s"}`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={clipPath} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {bands.map(({ stage, path, color, hasFile }) => (
          <path
            key={stage.id}
            d={path}
            fill={hasFile ? color : "none"}
            fillOpacity={hasFile ? 0.85 : 1}
            stroke="#57534e"
            strokeWidth={isSmall ? 1 : 1.5}
            strokeDasharray={hasFile ? undefined : "4 3"}
          />
        ))}
      </g>
      <path d={clipPath} fill="none" stroke="#57534e" strokeWidth={isSmall ? 1 : 1.5} />

      {!isSmall &&
        bands.map(({ stage, midY, rightEdge, hasFile }) => (
          <g key={stage.id}>
            <title>
              {stage.name}
              {hasFile ? ` — ${stage.file_label ?? "asset attached"}` : " — no asset yet"}
            </title>
            <line
              x1={rightEdge + 2}
              y1={midY}
              x2={rightEdge + 16}
              y2={midY}
              stroke="currentColor"
              strokeOpacity={0.4}
            />
            <text x={rightEdge + 20} y={midY} dominantBaseline="middle" fontSize={11} fill="currentColor">
              <tspan fontWeight={600}>{stage.name}</tspan>
              <tspan dx={6} fillOpacity={0.75}>
                {hasFile
                  ? (stage.file_label ?? "Asset attached").length > 26
                    ? `${(stage.file_label ?? "Asset attached").slice(0, 26)}…`
                    : stage.file_label ?? "Asset attached"
                  : "No asset yet"}
              </tspan>
            </text>
          </g>
        ))}
    </svg>
  );
}
