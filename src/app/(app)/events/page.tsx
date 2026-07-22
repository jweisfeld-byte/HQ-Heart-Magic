import Link from "next/link";
import { getEvents, type Event } from "@/lib/events/queries";
import { getTasksForEvent } from "@/lib/tasks/queries";
import { listWorkspaceUsers } from "@/lib/settings/queries";
import { TaskBoard } from "@/components/tasks/TaskBoard";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function ymd(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function daysInMonth(year: number, month: number) {
  // month is 1-12; day 0 of next month = last day of this month.
  return new Date(year, month, 0).getDate();
}

function firstWeekday(year: number, month: number) {
  // 0 = Sunday
  return new Date(year, month - 1, 1).getDay();
}

function addMonths(year: number, month: number, delta: number) {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

// Month-grid calendar (Screens & Flows-style Template, applied to
// events): a real calendar grid rather than a plain date-sorted list,
// per Jacob's explicit ask. Day cells link to /events/new prefilled
// with that date; existing events on a day render as small chips
// linking to their detail page.
export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;

  const today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth() + 1;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    year = y;
    month = m;
  }

  const events = await getEvents();

  if (events === null) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          Not set up yet. Run{" "}
          <code className="text-xs">supabase/events_schema.sql</code> in the
          Supabase SQL Editor to create the Events table.
        </div>
      </div>
    );
  }

  const byDay = new Map<string, Event[]>();
  for (const e of events) {
    const arr = byDay.get(e.event_date);
    if (arr) arr.push(e);
    else byDay.set(e.event_date, [e]);
  }

  const totalDays = daysInMonth(year, month);
  const leadingBlanks = firstWeekday(year, month);
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prev = addMonths(year, month, -1);
  const next = addMonths(year, month, 1);
  const todayStr = ymd(today.getFullYear(), today.getMonth() + 1, today.getDate());

  // Events visible in the currently-viewed month grid, chronological —
  // used for the "Tasks for events" section below the calendar
  // (Jacob's ask: "below the calendar in events tab, make a tasks for
  // event section").
  const monthPrefix = `${year}-${pad(month)}`;
  const monthEvents = events
    .filter((e) => e.event_date.startsWith(monthPrefix))
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  const [users, eventTaskLists] = await Promise.all([
    listWorkspaceUsers(),
    Promise.all(monthEvents.map((e) => getTasksForEvent(e.id))),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Events
          </h1>
          <p className="mt-1 text-sm text-muted">
            Upcoming events, who&apos;s on point, and what to know.
          </p>
        </div>
        <Link
          href={`/events/new?date=${todayStr}`}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          New event
        </Link>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/events?month=${prev.year}-${pad(prev.month)}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent/5"
          >
            ← Prev
          </Link>
          <Link
            href={`/events?month=${today.getFullYear()}-${pad(today.getMonth() + 1)}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent/5"
          >
            Today
          </Link>
          <Link
            href={`/events?month=${next.year}-${pad(next.month)}`}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent/5"
          >
            Next →
          </Link>
        </div>
        <p className="font-display text-lg font-semibold text-foreground">
          {MONTH_NAMES[month - 1]} {year}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="bg-surface px-2 py-1.5 text-center text-xs font-medium uppercase tracking-wide text-muted"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={i} className="min-h-[90px] bg-background" />;
          }
          const dateStr = ymd(year, month, day);
          const dayEvents = byDay.get(dateStr) ?? [];
          const isToday = dateStr === todayStr;
          const hasEvents = dayEvents.length > 0;

          return (
            <div
              key={i}
              className={`flex min-h-[90px] flex-col gap-1 p-1.5 ${
                hasEvents ? "border-border bg-surface" : "bg-surface"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium ${
                    isToday
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white"
                      : "text-muted"
                  }`}
                >
                  {day}
                </span>
                <Link
                  href={`/events/new?date=${dateStr}`}
                  className="text-xs text-muted hover:text-accent"
                  aria-label={`Add event on ${dateStr}`}
                >
                  +
                </Link>
              </div>
              <div className="flex flex-col gap-0.5">
                {dayEvents.map((e) => (
                  <Link
                    key={e.id}
                    href={`/events/${e.id}`}
                    className="truncate rounded bg-accent/15 px-1.5 py-0.5 text-sm font-bold text-accent hover:bg-accent/25"
                    title={e.title}
                  >
                    {e.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          No events yet.{" "}
          <Link href={`/events/new?date=${todayStr}`} className="text-accent hover:underline">
            Add the first one
          </Link>
          .
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Tasks for events
        </h2>
        <p className="mt-1 text-sm text-muted">
          What needs to happen for each event this month.
        </p>

        {monthEvents.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
            No events in {MONTH_NAMES[month - 1]} {year}.
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-8">
            {monthEvents.map((e, i) => {
              const tasks = eventTaskLists[i] ?? [];
              return (
                <div key={e.id}>
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/events/${e.id}`}
                      className="font-display text-base font-semibold text-foreground hover:text-accent"
                    >
                      {e.title}
                    </Link>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted">{e.event_date}</span>
                      <Link
                        href={`/tasks/new?event=${e.id}`}
                        className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-foreground hover:bg-accent/5"
                      >
                        + Add task
                      </Link>
                    </div>
                  </div>
                  <div className="mt-2">
                    <TaskBoard tasks={tasks} users={users ?? []} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
