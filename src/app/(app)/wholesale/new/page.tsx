import Link from "next/link";
import { createAccountAction } from "@/app/(app)/wholesale/actions";
import { STAGES, STAGE_LABELS } from "@/lib/wholesale/queries";

export default function NewWholesaleAccountPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/wholesale" className="text-sm text-muted hover:text-accent">
        ← Wholesale
      </Link>
      <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
        New business
      </h1>

      <form action={createAccountAction} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-foreground">
            Company name
          </label>
          <input
            name="companyName"
            required
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="e.g. Wildflower Grocery Co."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              Contact name
            </label>
            <input
              name="contactName"
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
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">
              Stage
            </label>
            <select
              name="stage"
              defaultValue="lead"
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
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              placeholder="you@heartmagiccacao.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">
              Next follow-up date
            </label>
            <input
              name="nextFollowUpAt"
              type="date"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Notes</label>
          <textarea
            name="notes"
            rows={6}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="Order volume, terms discussed, how they found us..."
          />
        </div>

        <div className="mt-2 flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Create business
          </button>
          <Link
            href="/wholesale"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
