import type { FunnelStage } from "@/lib/funnels/queries";

export type FunnelTriangleStage = FunnelStage & {
  assets: { label: string; hasFile: boolean; fileLabel: string | null }[];
};

type Point = readonly [number, number];

function normalize([x, y]: Point): Point {
  const len = Math.hypot(x, y) || 1;
  return [x / len, y / len];
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
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
// the order stages were added. Each band is colored in once at least
// one of its formats has a Google Drive asset attached; empty stages
// render as a dashed, empty band. Bands are sized by `size_percent`
// when set, otherwise split evenly. The label beside each band lists
// every format built out for that stage plus the actual attached file
// name (Jacob's ask) — label rows are stacked with their own vertical
// layout (not tied 1:1 to the band's proportional height) so a stage
// with many formats doesn't overlap its neighbors' labels; a leader
// line still connects each label back to its band's actual midpoint.
export function FunnelTriangle({
  stages,
  size = "large",
}: {
  stages: FunnelTriangleStage[];
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
  const labelAreaWidth = isSmall ? 0 : 230;
  const width = apexX + baseHalfWidth + labelAreaWidth;

  const titleLineHeight = isSmall ? 12 : 15;
  const bodyLineHeight = isSmall ? 10 : 13;
  const blockGap = isSmall ? 8 : 12;
  const topPad = isSmall ? 10 : 20;
  const bottomPad = isSmall ? 10 : 20;

  // Each stage's label block: its title line plus one line per format
  // (or a single "No formats yet" line), sized to fit whatever content
  // it actually has.
  const labelBlocks = stages.map((stage) => {
    const bodyLines =
      stage.assets.length === 0
        ? ["No formats yet"]
        : stage.assets.map((a) =>
            a.hasFile
              ? `${a.label}: ${truncate(a.fileLabel ?? "Attached", 26)}`
              : `${a.label} — no file yet`,
          );
    const blockHeight = titleLineHeight + bodyLines.length * bodyLineHeight;
    return { bodyLines, blockHeight };
  });

  const labelLayout = labelBlocks.reduce<{ tops: number[]; cursor: number }>(
    (acc, block) => {
      const top = acc.cursor;
      return { tops: [...acc.tops, top], cursor: acc.cursor + block.blockHeight + blockGap };
    },
    { tops: [], cursor: 0 },
  );
  const labelContentHeight = Math.max(0, labelLayout.cursor - blockGap);

  const height = Math.max(
    isSmall ? 100 : 160,
    labelContentHeight + topPad + bottomPad,
  );
  const apexY = topPad;
  const baseY = height - bottomPad;

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
    const hasFile = stage.assets.some((a) => a.hasFile);

    const labelTop = topPad + labelLayout.tops[index];
    const { bodyLines } = labelBlocks[index];

    return { stage, path, midY, rightEdge, color, hasFile, labelTop, bodyLines };
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
      className="h-auto w-full text-foreground"
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
        bands.map(({ stage, midY, rightEdge, labelTop, bodyLines }) => (
          <g key={stage.id}>
            <title>
              {stage.name}
              {stage.strategy ? ` — ${stage.strategy}` : ""}
            </title>
            <line
              x1={rightEdge + 2}
              y1={midY}
              x2={rightEdge + 16}
              y2={labelTop + titleLineHeight / 2}
              stroke="currentColor"
              strokeOpacity={0.4}
            />
            <text
              x={rightEdge + 20}
              y={labelTop + titleLineHeight - 3}
              fontSize={12}
              fontWeight={600}
              fill="currentColor"
            >
              {stage.name}
            </text>
            {bodyLines.map((line, li) => (
              <text
                key={li}
                x={rightEdge + 20}
                y={labelTop + titleLineHeight + (li + 1) * bodyLineHeight - 3}
                fontSize={10}
                fillOpacity={0.75}
                fill="currentColor"
              >
                {line}
              </text>
            ))}
          </g>
        ))}
    </svg>
  );
}
