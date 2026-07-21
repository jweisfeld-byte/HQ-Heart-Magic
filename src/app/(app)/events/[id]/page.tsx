import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/events/queries";
import { deleteEventAction, updateEventAction } from "@/app/(app)/events/actions";
import { listWorkspaceUsers } from "@/lib/settings/queries";
import { DeleteEventButton } from "@/components/events/DeleteEventButton";

function formatDate(iso: string) {
  // event_date comes back as "YYYY-MM-DD" — construct in local time
  // (not UTC) so the displayed day never shifts by one.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;

  const event = await getEventById(id);
  if (!event) notFound();

  if (edit) {
    const users = await listWorkspaceUsers();

    return (
      <div className="mx-auto max-w-2xl">
        <Link href={`/events/${event.id}`} className="text-sm text-muted hover:text-accent">
          ← Cancel
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
          Edit event
        </h1>

        <form action={updateEventAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="id" value={event.id} />

          <div>
            <label className="text-sm font-medium text-foreground">
              Event name
            </label>
            <input
              name="title"
              required
              defaultValue={event.title}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Date
            </label>
            <input
              name="eventDate"
              type="date"
              required
              defaultValue={event.event_date}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Assigned to
            </label>
            {users && users.length > 0 ? (
              <select
                name="assigneeEmail"
                defaultValue={event.assignee_email ?? ""}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.email}
                  </option>
                ))}
              </select>
            ) : (
              <input
                name="assigneeEmail"
                type="email"
                defaultValue={event.assignee_email ?? ""}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              />
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Point of contact
            </label>
            <input
              name="pointOfContact"
              defaultValue={event.point_of_contact}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Notes
            </label>
            <textarea
              name="notes"
              rows={5}
              defaultValue={event.notes}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div className="mt-2 flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Save changes
            </button>
            <Link
              href={`/events/${event.id}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/events" className="text-sm text-muted hover:text-accent">
        ← Events
      </Link>

      <div className="mt-1 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {event.title}
          </h1>
          <p className="mt-1 text-sm text-muted">{formatDate(event.event_date)}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/events/${event.id}?edit=1`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
          >
            Edit
          </Link>
          <DeleteEventButton id={event.id} title={event.title} action={deleteEventAction} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Assigned to
          </p>
          <p className="mt-1 text-sm text-foreground">
            {event.assignee_email || "Unassigned"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Point of contact
          </p>
          <p className="mt-1 text-sm text-foreground">
            {event.point_of_contact || "—"}
          </p>
        </div>
      </div>

      {event.notes && (
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-border bg-surface p-4 text-sm text-foreground">
          {event.notes}
        </div>
      )}
    </div>
  );
}
