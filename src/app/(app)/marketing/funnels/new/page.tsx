import Link from "next/link";
import { createFunnelAction } from "@/app/(app)/marketing/funnels/actions";
import { StageNameRows } from "@/components/funnels/StageNameRows";

export default function NewFunnelPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/marketing/funnels" className="text-sm text-muted hover:text-accent">
        ← Funnels
      </Link>
      <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
        New funnel
      </h1>

      <form action={createFunnelAction} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium text-foreground">
            Funnel name
          </label>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="e.g. TikTok Cold Traffic → Website"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            Description
          </label>
          <textarea
            name="description"
            rows={3}
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            placeholder="Any context — the channel, the offer, who it's for."
          />
        </div>

        <StageNameRows initial={["Awareness", "Interest", "Decision", "Action"]} />

        <div className="mt-2 flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Create funnel
          </button>
          <Link
            href="/marketing/funnels"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
