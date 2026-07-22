import Link from "next/link";
import { notFound } from "next/navigation";
import { getFunnelById, getFunnelStages } from "@/lib/funnels/queries";
import {
  updateFunnelAction,
  deleteFunnelAction,
  addStageAction,
  renameStageAction,
  setStageFileAction,
  removeStageFileAction,
  deleteStageAction,
} from "@/app/(app)/marketing/funnels/actions";
import { FunnelTriangle } from "@/components/funnels/FunnelTriangle";
import { FunnelStageDriveAttach } from "@/components/funnels/FunnelStageDriveAttach";

export default async function FunnelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;

  const funnel = await getFunnelById(id);
  if (!funnel) notFound();

  if (edit) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href={`/marketing/funnels/${funnel.id}`} className="text-sm text-muted hover:text-accent">
          ← Cancel
        </Link>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
          Edit funnel
        </h1>

        <form action={updateFunnelAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="id" value={funnel.id} />
          <div>
            <label className="text-sm font-medium text-foreground">Funnel name</label>
            <input
              name="name"
              required
              defaultValue={funnel.name}
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={funnel.description}
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
          </div>
        </form>

        <form action={deleteFunnelAction} className="mt-8 border-t border-border pt-6">
          <input type="hidden" name="id" value={funnel.id} />
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Delete this funnel
          </button>
        </form>
      </div>
    );
  }

  const stages = (await getFunnelStages(funnel.id)) ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/marketing/funnels" className="text-sm text-muted hover:text-accent">
        ← Funnels
      </Link>
      <div className="mt-1 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            {funnel.name}
          </h1>
          {funnel.description && (
            <p className="mt-1 max-w-xl text-sm text-muted">{funnel.description}</p>
          )}
        </div>
        <Link
          href={`/marketing/funnels/${funnel.id}?edit=1`}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-accent/5"
        >
          Edit
        </Link>
      </div>

      <div className="mt-8 flex justify-center rounded-xl border border-border bg-surface p-6">
        <FunnelTriangle stages={stages} />
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Stages
        </h2>
        <p className="mt-1 text-sm text-muted">
          Attach the actual creative for each step — the triangle above fills in as stages get an asset.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <form action={renameStageAction} className="flex-1">
                <input type="hidden" name="id" value={stage.id} />
                <input type="hidden" name="funnelId" value={funnel.id} />
                <input
                  name="name"
                  defaultValue={stage.name}
                  onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                  className="w-full rounded-lg border border-transparent bg-transparent px-1 py-1 text-sm font-medium text-foreground hover:border-border focus:border-border focus:bg-background focus:outline-none"
                />
              </form>

              <div className="w-64 shrink-0">
                <FunnelStageDriveAttach
                  stage={stage}
                  funnelId={funnel.id}
                  action={setStageFileAction}
                  removeAction={removeStageFileAction}
                />
              </div>

              <form action={deleteStageAction}>
                <input type="hidden" name="id" value={stage.id} />
                <input type="hidden" name="funnelId" value={funnel.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-accent/5 hover:text-red-600"
                  aria-label="Remove stage"
                >
                  ×
                </button>
              </form>
            </div>
          ))}

          {stages.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
              No stages yet.
            </div>
          )}
        </div>

        <form action={addStageAction} className="mt-4 flex items-center gap-2">
          <input type="hidden" name="funnelId" value={funnel.id} />
          <input
            name="name"
            placeholder="e.g. Retargeting"
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
          />
          <button
            type="submit"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/5"
          >
            + Add stage
          </button>
        </form>
      </div>
    </div>
  );
}
