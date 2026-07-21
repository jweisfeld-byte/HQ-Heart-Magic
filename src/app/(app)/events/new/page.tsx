import Link from "next/link";
import { createEventAction } from "@/app/(app)/events/actions";
import { listWorkspaceUsers } from "@/lib/settings/queries";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const users = await listWorkspaceUsers();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/events" className="text-sm text-muted hover:text-accent">
        ← Events
      </Link>
      <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
        New event
      </h1>

      <form action={createEventAction} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-foreground">
            Event name
          </label>
          <input
            name="title"
            required
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="e.g. Austin Farmers Market Popup"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Date</label>
          <input
            name="eventDate"
            type="date"
            required
            defaultValue={date ?? ""}
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
              defaultValue=""
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
              placeholder="teammate@heartmagiccacao.com"
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
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="Name, phone, or email of who to coordinate with"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            Notes
          </label>
          <textarea
            name="notes"
            rows={5}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="Setup details, what to bring, timing, anything else."
          />
        </div>

        <div className="mt-2 flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Create event
          </button>
          <Link
            href="/events"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
