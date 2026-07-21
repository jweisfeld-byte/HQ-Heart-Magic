import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getActivityForAccount,
  getWholesaleAccountById,
  STAGES,
  STAGE_LABELS,
} from "@/lib/wholesale/queries";
import {
  logActivityAction,
  updateAccountAction,
} from "@/app/(app)/wholesale/actions";

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isOverdue(iso: string | null) {
  if (!iso) return false;
  return new Date(iso) < new Date(new Date().toDateString());
}

export default async function WholesaleAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;

  const account = await getWholesaleAccountById(id);
  if (!account) notFound();

  const activity = await getActivityForAccount(account.id);

  if (edit) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/wholesale/${account.id}`}
          className="text-sm text-muted hover:text-accent"
        >
          ← Cancel
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
          Edit business
        </h1>

        <form
          action={updateAccountAction}
          className="mt-6 flex flex-col gap-4"
        >
          <input type="hidden" name="id" value={account.id} />

          <div>
            <label className="text-sm font-medium text-foreground">
              Company name
            </label>
            <input
              name="companyName"
              required
              defaultValue={account.company_name}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Contact name
              </label>
              <input
                name="contactName"
                defaultValue={account.contact_name ?? ""}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Contact email
              </label>
              <input
                name="contactEmail"
                type="email"
                defaultValue={account.contact_email ?? ""}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Contact phone
              </label>
              <input
                name="contactPhone"
                type="tel"
                defaultValue={account.contact_phone ?? ""}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Stage
              </label>
              <select
                name="stage"
                defaultValue={account.stage}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Address
            </label>
            <input
              name="address"
              defaultValue={account.address ?? ""}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Owner (assigned rep)
              </label>
              <input
                name="ownerEmail"
                type="email"
                defaultValue={account.owner_email ?? ""}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Next follow-up date
              </label>
              <input
                name="nextFollowUpAt"
                type="date"
                defaultValue={account.next_follow_up_at ?? ""}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Notes
            </label>
            <textarea
              name="notes"
              rows={6}
              defaultValue={account.notes}
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
              href={`/wholesale/${account.id}`}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    );
  }

  const overdue = isOverdue(account.next_follow_up_at);
  const followUpDate = formatDate(account.next_follow_up_at);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/wholesale" className="text-sm text-muted hover:text-accent">
        ← Wholesale
      </Link>

      <div className="mt-1 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {account.company_name}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {STAGE_LABELS[account.stage]}
            {account.owner_email ? ` · ${account.owner_email}` : ""}
          </p>
        </div>
        <Link
          href={`/wholesale/${account.id}?edit=1`}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
        >
          Edit
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Contact
          </p>
          <p className="mt-1 text-sm text-foreground">
            {account.contact_name ?? "—"}
          </p>
          {account.contact_email && (
            <a
              href={`mailto:${account.contact_email}`}
              className="block text-sm text-accent hover:underline"
            >
              {account.contact_email}
            </a>
          )}
          {account.contact_phone && (
            <a
              href={`tel:${account.contact_phone}`}
              className="block text-sm text-accent hover:underline"
            >
              {account.contact_phone}
            </a>
          )}
          {account.address && (
            <p className="mt-1 text-sm text-muted">{account.address}</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Next follow-up
          </p>
          {followUpDate ? (
            <p
              className={`mt-1 text-sm font-medium ${
                overdue ? "text-red-600" : "text-foreground"
              }`}
            >
              {overdue ? "Overdue: " : ""}
              {followUpDate}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">Not scheduled</p>
          )}
        </div>
      </div>

      {account.notes && (
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-border bg-surface p-4 text-sm text-foreground">
          {account.notes}
        </div>
      )}

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Activity
        </h2>
        <form
          action={logActivityAction}
          className="mt-3 flex flex-col gap-2 rounded-xl border border-border bg-surface p-4"
        >
          <input type="hidden" name="accountId" value={account.id} />
          <textarea
            name="note"
            required
            rows={3}
            placeholder="Log a call, email, sample sent, meeting..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <div>
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Log activity
            </button>
          </div>
        </form>

        {activity.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No activity logged yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {activity.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <p className="text-xs text-muted">
                  {formatDateTime(a.created_at)}
                  {a.logged_by ? ` · ${a.logged_by}` : ""}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                  {a.note}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
