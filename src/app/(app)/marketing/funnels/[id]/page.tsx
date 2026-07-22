import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getFunnelById,
  getFunnelStages,
  getAssetsForStages,
  CONTENT_CATEGORIES,
  CONTENT_CATEGORY_LABELS,
} from "@/lib/funnels/queries";
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
  updateAssetCopyAction,
  updateAssetCategoryAction,
  setAssetMetaAdAction,
  removeAssetMetaAdAction,
} from "@/app/(app)/marketing/funnels/actions";
import type { FunnelTriangleStage } from "@/components/funnels/FunnelTriangle";
import { ExpandableFunnelTriangle } from "@/components/funnels/ExpandableFunnelTriangle";
import { FunnelStageDriveAttach } from "@/components/funnels/FunnelStageDriveAttach";
import { AutoSubmitField } from "@/components/funnels/AutoSubmitField";
import { ContentCategorySelect } from "@/components/funnels/ContentCategorySelect";
import { MetaAdPicker } from "@/components/funnels/MetaAdPicker";
import { getAdInsights, type MetaAdInsights } from "@/lib/meta/queries";

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
  const assetsByStage = await getAssetsForStages(stages.map((s) => s.id));

  // Live spend/impressions/CTR for every format linked to a Meta ad
  // (Jacob's ask) — fetched in parallel, one insights call per unique
  // linked ad, so having the same ad linked twice doesn't double-fetch.
  const linkedAdIds = Array.from(
    new Set(
      Object.values(assetsByStage)
        .flat()
        .map((a) => a.meta_ad_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const insightsEntries = await Promise.all(
    linkedAdIds.map(async (adId) => [adId, await getAdInsights(adId)] as const),
  );
  const insightsByAdId: Record<string, MetaAdInsights | null> = Object.fromEntries(insightsEntries);

  const triangleStages: FunnelTriangleStage[] = stages.map((s) => {
    const assets = assetsByStage[s.id] ?? [];
    return {
      ...s,
      assets: assets.map((a) => ({
        label: a.label,
        hasFile: Boolean(a.drive_file_id || a.file_url),
        fileLabel: a.file_label,
      })),
    };
  });

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
        <ExpandableFunnelTriangle stages={triangleStages} />
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
                    <AutoSubmitField
                      name="name"
                      defaultValue={stage.name}
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
                  <AutoSubmitField
                    name="strategy"
                    defaultValue={stage.strategy}
                    multiline
                    rows={2}
                    placeholder="Creative strategy for this stage…"
                    className="w-full rounded-lg border border-transparent bg-transparent px-1 py-1 text-sm text-muted hover:border-border focus:border-border focus:bg-background focus:outline-none"
                  />
                </form>

                <div className="mt-3 flex flex-col gap-2">
                  {assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex flex-col gap-2 rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <form action={renameAssetAction} className="w-40 shrink-0">
                          <input type="hidden" name="id" value={asset.id} />
                          <input type="hidden" name="funnelId" value={funnel.id} />
                          <AutoSubmitField
                            name="label"
                            defaultValue={asset.label}
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
                        <ContentCategorySelect
                          id={asset.id}
                          funnelId={funnel.id}
                          category={asset.content_category}
                          action={updateAssetCategoryAction}
                        />
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

                      <form action={updateAssetCopyAction} className="pl-1">
                        <input type="hidden" name="id" value={asset.id} />
                        <input type="hidden" name="funnelId" value={funnel.id} />
                        <AutoSubmitField
                          name="adCopy"
                          defaultValue={asset.ad_copy}
                          multiline
                          rows={2}
                          placeholder="Ad copy for this format — headline, body, CTA…"
                          className="w-full rounded-lg border border-transparent bg-transparent px-1 py-1 text-xs text-muted hover:border-border focus:border-border focus:bg-surface focus:outline-none"
                        />
                      </form>

                      <div className="pl-1">
                        <MetaAdPicker
                          asset={asset}
                          funnelId={funnel.id}
                          action={setAssetMetaAdAction}
                          removeAction={removeAssetMetaAdAction}
                        />
                      </div>

                      {asset.meta_ad_id && (
                        <div className="pl-1">
                          {(() => {
                            const insights = insightsByAdId[asset.meta_ad_id];
                            if (!insights) {
                              return (
                                <p className="text-xs text-muted">
                                  Metrics not available yet for this ad.
                                </p>
                              );
                            }
                            return (
                              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-accent-soft/10 px-2 py-1.5 text-xs text-foreground">
                                <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700">
                                  Live · last 30d
                                </span>
                                <span>
                                  Spend{" "}
                                  <span className="font-semibold">
                                    ${insights.spend.toFixed(2)}
                                  </span>
                                </span>
                                <span>
                                  Impressions{" "}
                                  <span className="font-semibold">
                                    {insights.impressions.toLocaleString()}
                                  </span>
                                </span>
                                <span>
                                  Clicks{" "}
                                  <span className="font-semibold">
                                    {insights.clicks.toLocaleString()}
                                  </span>
                                </span>
                                <span>
                                  CTR{" "}
                                  <span className="font-semibold">
                                    {insights.ctr.toFixed(2)}%
                                  </span>
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))}

                  {assets.length === 0 && (
                    <p className="text-xs text-muted">No formats built out for this stage yet.</p>
                  )}

                  {assets.length > 0 && (() => {
                    // Jacob's ask: each stage should have an even split of
                    // UGC / Brand Made / AI across its formats — surfaced
                    // here as a quick counts readout, not a hard rule
                    // (stages won't always divide evenly by 3).
                    const counts: Record<string, number> = { ugc: 0, brand_made: 0, ai: 0 };
                    let uncategorized = 0;
                    for (const asset of assets) {
                      if (asset.content_category) {
                        counts[asset.content_category] += 1;
                      } else {
                        uncategorized += 1;
                      }
                    }
                    const categorized = assets.length - uncategorized;
                    const target = categorized > 0 ? categorized / 3 : 0;
                    const isEven =
                      uncategorized === 0 &&
                      CONTENT_CATEGORIES.every((c) => counts[c] === target);

                    return (
                      <div
                        className={`mt-1 flex flex-wrap items-center gap-2 rounded-lg px-2 py-1 text-xs ${
                          isEven
                            ? "bg-green-100 text-green-700"
                            : "bg-accent-soft/20 text-muted"
                        }`}
                      >
                        <span className="font-medium">Split:</span>
                        {CONTENT_CATEGORIES.map((c) => (
                          <span key={c}>
                            {CONTENT_CATEGORY_LABELS[c]} {counts[c]}
                          </span>
                        ))}
                        {uncategorized > 0 && <span>Uncategorized {uncategorized}</span>}
                        {!isEven && <span>— aim for an even split across the three</span>}
                      </div>
                    );
                  })()}
                </div>

                <form action={addAssetAction} className="mt-3 flex items-center gap-2">
                  <input type="hidden" name="stageId" value={stage.id} />
                  <input type="hidden" name="funnelId" value={funnel.id} />
                  <input
                    name="label"
                    required
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
            required
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
