import Link from "next/link";
import { notFound } from "next/navigation";
import { getFunnelById, getFunnelStages, getAssetsForStages } from "@/lib/funnels/queries";
import {
  updateFunnelAction,
  deleteFunnelAction,
  addStageAction,
  renameStageAction,
  deleteStageAction,
  updateStageStrategyAction,
  addAssetAction,
  renameAssetAction,
  setAssetFileAction,
  removeAssetFileAction,
  deleteAssetAction,
} from "@/app/(app)/marketing/funnels/actions";
import { FunnelTriangle, type FunnelTriangleStage } from "@/components/funnels/FunnelTriangle";
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

  let stages: Awaited<ReturnType<typeof getFunnelStages>> = [];
  let assetsByStage: Awaited<ReturnType<typeof getAssetsForStages>> = {};
  let debugError: string | null = null;
  try {
    stages = (await getFunnelStages(funnel.id)) ?? [];
    assetsByStage = await getAssetsForStages((stages ?? []).map((s) => s.id));
  } catch (err) {
    debugError = err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err);
    stages = [];
    assetsByStage = {};
  }

  if (debugError) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-medium text-red-600">Temporary debug output — remove after diagnosing:</p>
        <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-red-300 bg-red-50 p-4 text-xs text-red-800">
          {debugError}
        </pre>
      </div>
    );
  }

  const triangleStages: FunnelTriangleStage[] = (stages ?? []).map((s) => {
    const assets = assetsByStage[s.id] ?? [];
    return {
      ...s,
      assetCount: assets.length,
      filledAssetCount: assets.filter((a) => a.drive_file_id || a.file_url).length,
    };
  });

  // Calling FunnelTriangle as a plain function (it's a synchronous,
  // non-"use client" component) rather than as JSX lets this try/catch
  // actually catch a synchronous throw inside it, to pin down exactly
  // where the 500 on this page is coming from — JSX alone wouldn't be
  // caught here since React defers actually invoking child components.
  let triangleElement: ReturnType<typeof FunnelTriangle> | null = null;
  try {
    triangleElement = FunnelTriangle({ stages: triangleStages });
  } catch (err) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-medium text-red-600">
          Temporary debug output (FunnelTriangle threw) — remove after diagnosing:
        </p>
        <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-red-300 bg-red-50 p-4 text-xs text-red-800">
          {err instanceof Error ? `${err.message}\n${err.stack ?? ""}` : String(err)}
        </pre>
      </div>
    );
  }

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
        {triangleElement}
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Stages
        </h2>
        <p className="mt-1 text-sm text-muted">
          Each stage&apos;s creative strategy, plus every format built out for it — attach the actual asset from Google Drive.
        </p>

        <div className="mt-4 flex flex-col gap-4">
          {stages.map((stage) => {
            const assets = assetsByStage[stage.id] ?? [];
            return (
              <div key={stage.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-4">
                  <form action={renameStageAction} className="flex-1">
                    <input type="hidden" name="id" value={stage.id} />
                    <input type="hidden" name="funnelId" value={funnel.id} />
                    <input
                      name="name"
                      defaultValue={stage.name}
                      onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                      className="w-full rounded-lg border border-transparent bg-transparent px-1 py-1 font-display text-base font-semibold text-foreground hover:border-border focus:border-border focus:bg-background focus:outline-none"
                    />
                  </form>
                  <form action={deleteStageAction}>
                    <input type="hidden" name="id" value={stage.id} />
                    <input type="hidden" name="funnelId" value={funnel.id} />
                    <button
                      type="submit"
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-accent/5 hover:text-red-600"
                      aria-label="Remove stage"
                    >
                      Remove stage
                    </button>
                  </form>
                </div>

                <form action={updateStageStrategyAction} className="mt-2">
                  <input type="hidden" name="id" value={stage.id} />
                  <input type="hidden" name="funnelId" value={funnel.id} />
                  <textarea
                    name="strategy"
                    defaultValue={stage.strategy}
                    rows={2}
                    onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                    placeholder="Creative strategy for this stage…"
                    className="w-full rounded-lg border border-transparent bg-transparent px-1 py-1 text-sm text-muted hover:border-border focus:border-border focus:bg-background focus:outline-none"
                  />
                </form>

                <div className="mt-3 flex flex-col gap-2">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <form action={renameAssetAction} className="w-40 shrink-0">
                        <input type="hidden" name="id" value={asset.id} />
                        <input type="hidden" name="funnelId" value={funnel.id} />
                        <input
                          name="label"
                          defaultValue={asset.label}
                          onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                          className="w-full rounded-lg border border-transparent bg-transparent px-1 py-1 text-xs font-semibold uppercase tracking-wide text-muted hover:border-border focus:border-border focus:bg-surface focus:outline-none"
                        />
                      </form>
                      <div className="flex-1">
                        <FunnelStageDriveAttach
                          stage={asset}
                          funnelId={funnel.id}
                          action={setAssetFileAction}
                          removeAction={removeAssetFileAction}
                        />
                      </div>
                      <form action={deleteAssetAction}>
                        <input type="hidden" name="id" value={asset.id} />
                        <input type="hidden" name="funnelId" value={funnel.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:bg-accent/5 hover:text-red-600"
                          aria-label="Remove format"
                        >
                          ×
                        </button>
                      </form>
                    </div>
                  ))}

                  {assets.length === 0 && (
                    <p className="text-xs text-muted">No formats built out for this stage yet.</p>
                  )}
                </div>

                <form action={addAssetAction} className="mt-3 flex items-center gap-2">
                  <input type="hidden" name="stageId" value={stage.id} />
                  <input type="hidden" name="funnelId" value={funnel.id} />
                  <input
                    name="label"
                    placeholder="e.g. Founder Story Ad"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                  />
                  <button
                    type="submit"
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent/5"
                  >
                    + Add format
                  </button>
                </form>
              </div>
            );
          })}

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
