"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Manual Meta ad picker for one funnel format (Jacob confirmed manual
 * selection over auto-matching by naming convention). Opens a small
 * modal, searches the connected ad account's ads via /api/meta/ads
 * (a plain JSON route, since this needs fetch-on-demand rather than a
 * form submit), and links the chosen ad onto this funnel_stage_asset.
 */

type MetaAd = {
  id: string;
  name: string;
  status: string;
  thumbnailUrl: string | null;
};

type MetaAdLinkable = {
  id: string;
  meta_ad_id: string | null;
  meta_ad_name: string | null;
  meta_ad_thumbnail_url: string | null;
};

export function MetaAdPicker({
  asset,
  funnelId,
  action,
  removeAction,
}: {
  asset: MetaAdLinkable;
  funnelId: string;
  action: (formData: FormData) => void;
  removeAction: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [ads, setAds] = useState<MetaAd[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      fetch(`/api/meta/ads?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.error) {
            setError(json.error);
            setAds([]);
          } else {
            setAds(json.ads ?? []);
          }
        })
        .catch(() => setError("Couldn't reach Meta — try again."))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [open, query]);

  function pickAd(ad: MetaAd) {
    const form = formRef.current;
    if (!form) return;
    (form.elements.namedItem("metaAdId") as HTMLInputElement).value = ad.id;
    (form.elements.namedItem("metaAdName") as HTMLInputElement).value = ad.name;
    (form.elements.namedItem("metaAdThumbnailUrl") as HTMLInputElement).value =
      ad.thumbnailUrl ?? "";
    form.requestSubmit();
    setOpen(false);
  }

  const hasAd = Boolean(asset.meta_ad_id);

  return (
    <div className="flex flex-col gap-1">
      <form ref={formRef} action={action} onClick={(e) => e.stopPropagation()}>
        <input type="hidden" name="id" value={asset.id} />
        <input type="hidden" name="funnelId" value={funnelId} />
        <input type="hidden" name="metaAdId" defaultValue={asset.meta_ad_id ?? ""} />
        <input type="hidden" name="metaAdName" defaultValue={asset.meta_ad_name ?? ""} />
        <input
          type="hidden"
          name="metaAdThumbnailUrl"
          defaultValue={asset.meta_ad_thumbnail_url ?? ""}
        />
      </form>

      {hasAd ? (
        <div className="flex items-center gap-2">
          {asset.meta_ad_thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={asset.meta_ad_thumbnail_url}
              alt=""
              className="h-6 w-6 shrink-0 rounded object-cover"
            />
          ) : null}
          <span className="truncate text-sm text-foreground" title={asset.meta_ad_name ?? undefined}>
            📣 {asset.meta_ad_name ?? "Linked ad"}
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs text-muted hover:text-accent"
          >
            Change
          </button>
          <form action={removeAction} onClick={(e) => e.stopPropagation()}>
            <input type="hidden" name="id" value={asset.id} />
            <input type="hidden" name="funnelId" value={funnelId} />
            <button type="submit" className="text-xs text-muted hover:text-red-600">
              Unlink
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-left text-sm text-accent hover:underline"
        >
          📣 Link Meta ad
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl bg-surface p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-foreground">
                Link a Meta ad
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-muted hover:text-foreground"
              >
                Close
              </button>
            </div>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ads by name…"
              className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <div className="mt-3 flex-1 overflow-y-auto">
              {loading ? (
                <p className="p-3 text-sm text-muted">Loading…</p>
              ) : error ? (
                <p className="p-3 text-sm text-red-600">{error}</p>
              ) : ads.length === 0 ? (
                <p className="p-3 text-sm text-muted">No ads found.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {ads.map((ad) => (
                    <li key={ad.id}>
                      <button
                        type="button"
                        onClick={() => pickAd(ad)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-accent/5"
                      >
                        {ad.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ad.thumbnailUrl}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-accent-soft/30 text-xs">
                            📣
                          </span>
                        )}
                        <span className="flex-1 truncate text-foreground">{ad.name}</span>
                        <span className="shrink-0 text-xs text-muted">{ad.status}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
