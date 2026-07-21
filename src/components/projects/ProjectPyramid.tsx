import type { Task } from "@/lib/tasks/queries";

type PyramidTask = Pick<Task, "id" | "title" | "status">;

// One horizontal slice per task (Jacob's ask), ordered bottom-to-top by
// the order tasks were added — earliest/foundational task forms the
// wide base, the most recently added task is the tip. Each slice is
// sized equally (100 / task count) since that's the share of the
// project each task represents, and is labeled with that percentage
// via a leader line out to the right (keeps the label readable even
// when a project has many thin slices). Slices render solid black
// until their task's status flips to "done," at which point they fill
// with the same rainbow used for the border-glow effect elsewhere.
export function ProjectPyramid({ tasks }: { tasks: PyramidTask[] }) {
  const n = tasks.length;

  if (n === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted">
        No tasks in this project yet.
      </div>
    );
  }

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

  // tasks[0] is the oldest/bottom slice (level N-1 from the apex);
  // tasks[n-1] is the newest/tip slice (level 0 from the apex).
  const slices = tasks.map((task, index) => {
    const level = n - 1 - index;
    const f0 = level / n;
    const f1 = (level + 1) / n;

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

    const midF = (level + 0.5) / n;
    const midY = yAtFraction(midF);
    const rightEdge = apexX + widthAtFraction(midF) / 2;

    const pct = 100 / n;
    const pctLabel = Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;

    return { task, path, midY, rightEdge, pctLabel, done: task.status === "done" };
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full max-w-md text-foreground"
      role="img"
      aria-label={`Pyramid of ${n} task${n === 1 ? "" : "s"}`}
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
      </defs>

      {slices.map(({ task, path, midY, rightEdge, pctLabel, done }) => (
        <g key={task.id}>
          <path
            d={path}
            fill={done ? "url(#pyramidRainbow)" : "#000000"}
            stroke="#57534e"
            strokeWidth={1.5}
          >
            <title>
              {task.title} — {pctLabel} of project{done ? " (done)" : ""}
            </title>
          </path>
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
