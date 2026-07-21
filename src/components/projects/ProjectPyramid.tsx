import type { Task } from "@/lib/tasks/queries";

type PyramidTask = Pick<Task, "id" | "title" | "status" | "project_percent">;

type Point = readonly [number, number];

function normalize([x, y]: Point): Point {
  const len = Math.hypot(x, y) || 1;
  return [x / len, y / len];
}

// Rounds every corner of a closed polygon by a fixed radius — used to
// round the pyramid's three outer corners (apex tip, base-left,
// base-right) via a single clip-path rather than reworking each
// slice's own straight-edged geometry.
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

// One horizontal slice per task (Jacob's ask), ordered bottom-to-top by
// the order tasks were added — earliest/foundational task forms the
// wide base, the most recently added task is the tip. Each slice's
// height is proportional to the task's manually-entered % share of the
// project (task.project_percent) so the pyramid always reads as one
// whole, even if the percentages people typed in don't add up to
// exactly 100 — the label on each slice still shows the raw number
// that was typed in, not the normalized one, so Jacob can see and fix
// a mis-adding set of percentages. Tasks with no percent set yet fall
// back to an equal split so they still show up instead of vanishing.
// Slices render solid black until their task's status flips to "done,"
// at which point they fill with the same rainbow used for the
// border-glow effect elsewhere.
export function ProjectPyramid({ tasks }: { tasks: PyramidTask[] }) {
  const n = tasks.length;

  if (n === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted">
        No tasks in this project yet.
      </div>
    );
  }

  const anySet = tasks.some((t) => t.project_percent !== null);
  const sum = tasks.reduce((total, t) => total + (t.project_percent ?? 0), 0);
  const useEqualSplit = !anySet || sum <= 0;

  const shares = tasks.map((t) =>
    useEqualSplit ? 1 / n : (t.project_percent ?? 0) / sum,
  );

  const apexX = 150;
  const baseHalfWidth = 130;
  const apexY = 20;
  const rowHeight = 26;
  const height = Math.max(160, n * rowHeight + 40);
  const baseY = height - 20;
  const labelAreaWidth = 190;
  const width = apexX + baseHalfWidth + labelAreaWidth;

  const widthAtFraction = (f: number) => f * baseHalfWidth * 2;
  const yAtFraction = (f: number) => apexY + f * (baseY - apexY);

  // tasks[0] is the oldest/bottom slice; tasks[n-1] is the newest/tip
  // slice. Cumulative share (from the apex down) sets each boundary.
  const reversedBounds = shares.slice().reverse().reduce<
    { bounds: (readonly [number, number])[]; total: number }
  >(
    (acc, share) => {
      const f0 = acc.total;
      const f1 = f0 + share;
      return { bounds: [...acc.bounds, [f0, f1] as const], total: f1 };
    },
    { bounds: [], total: 0 },
  ).bounds;
  const sliceBounds = reversedBounds.slice().reverse();

  const slices = tasks.map((task, index) => {
    const [f0, f1] = sliceBounds[index];

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

    const raw = task.project_percent;
    const pctLabel =
      raw === null
        ? "—"
        : Number.isInteger(raw)
          ? `${raw}%`
          : `${raw.toFixed(1)}%`;

    return { task, path, midY, rightEdge, pctLabel, done: task.status === "done" };
  });

  // Unique per distinct set of tasks so multiple pyramids on one page
  // (the Projects hub shows one per project) don't share a clip-path id.
  const clipId = `pyramid-clip-${tasks.map((t) => t.id).join("-") || "empty"}`;
  const cornerRadius = 10;
  const clipPath = roundedPolygonPath(
    [
      [apexX, apexY],
      [apexX + baseHalfWidth, baseY],
      [apexX - baseHalfWidth, baseY],
    ],
    cornerRadius,
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full max-w-md text-foreground"
      role="img"
      aria-label={`Progress pyramid of ${n} task${n === 1 ? "" : "s"}`}
    >
      <defs>
        <linearGradient id="pyramidRainbow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="17%" stopColor="#f97316" />
          <stop offset="34%" stopColor="#eab308" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="67%" stopColor="#3b82f6" />
          <stop offset="84%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={clipPath} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {slices.map(({ task, path, done }) => (
          <path
            key={task.id}
            d={path}
            fill={done ? "url(#pyramidRainbow)" : "#000000"}
            stroke="#57534e"
            strokeWidth={1.5}
          />
        ))}
      </g>
      {/* Rounded outer outline drawn on top since the clip above hides
          the fill/stroke of slices right at the rounded corners. */}
      <path d={clipPath} fill="none" stroke="#57534e" strokeWidth={1.5} />

      {slices.map(({ task, midY, rightEdge, pctLabel, done }) => (
        <g key={task.id}>
          <title>
            {task.title} — {pctLabel} of project{done ? " (done)" : ""}
          </title>
          <line
            x1={rightEdge + 2}
            y1={midY}
            x2={rightEdge + 16}
            y2={midY}
            stroke="currentColor"
            strokeOpacity={0.4}
          />
          <text
            x={rightEdge + 20}
            y={midY}
            dominantBaseline="middle"
            fontSize={11}
            fill="currentColor"
          >
            <tspan fontWeight={600}>{pctLabel}</tspan>
            <tspan dx={6} fillOpacity={0.75}>
              {task.title.length > 26 ? `${task.title.slice(0, 26)}…` : task.title}
            </tspan>
          </text>
        </g>
      ))}
    </svg>
  );
}
