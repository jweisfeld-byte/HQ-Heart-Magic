import Link from "next/link";
import { getFunnels, getFunnelStageCounts } from "@/lib/funnels/queries";

export default async function FunnelsPage() {
  const funnels = await getFunnels();

  if (!funnels) {
    return (
      <div className="mx-auto max-w-4xl">
        <Link href="/marketing" className="text-sm text-muted hover:text-accent">
          ← Marketing
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
          Funnels
        </h1>
        <div className="mt-6 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          Not set up yet. Run{" "}
          <code className="text-xs">supabase/funnels_schema.sql</code> in the
          Supabase SQL Editor to create the Funnels tables.
        </div>
      </div>
    );
  }

  const counts = await getFunnelStageCounts(funnels.map((f) => f.id));

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/marketing" className="text-sm text-muted hover:text-accent">
        ← Marketing
      </Link>
      <div className="mt-1 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Funnels
          </h1>
          <p className="mt-1 text-sm text-muted">
            Every funnel as a triangle — build it out stage by stage with the actual creative for each step.
          </p>
        </div>
        <Link
          href="/marketing/funnels/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          New funnel
        </Link>
      </div>

      {funnels.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          No funnels yet.{" "}
          <Link href="/marketing/funnels/new" className="text-accent hover:underline">
            Build the first one
          </Link>
          .
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {funnels.map((f) => (
            <Link
              key={f.id}
              href={`/marketing/funnels/${f.id}`}
              className="rounded-xl border border-border bg-surface p-5 transition hover:border-accent/40 hover:bg-accent/5"
            >
              <h2 className="font-display text-base font-semibold text-foreground">
                {f.name}
              </h2>
              {f.description && (
                <p className="mt-1 text-sm text-muted">{f.description}</p>
              )}
              <p className="mt-2 text-xs text-muted">
                {counts[f.id] ?? 0} stage{(counts[f.id] ?? 0) === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
