import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEntriesForLibrary,
  getEntryTypesForLibrary,
  getLibraryByKey,
} from "@/lib/knowledge/queries";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-accent-soft/30 text-accent",
  archived: "bg-border text-muted",
};

// Shared Module List View (Template A): filterable by Entry Type, per the
// Application Architecture v1 capability map (Section 2). Used by every
// mini-hub's collections — the hub/basePath is the only thing that varies.
//
// `flat`: single-collection destinations (Creators, Analytics,
// Experiments — Application Architecture v1 Section 4) skip the mini-hub
// entirely, so their routes are basePath/[id] rather than
// basePath/[libraryKey]/[id], and there's no hub to link back to.
export async function LibraryListPage({
  libraryKey,
  basePath,
  hubLabel,
  activeTypeKey,
  flat = false,
  variant = "table",
  cardPhotoKey,
  cardSubtitleKey,
}: {
  libraryKey: string;
  basePath: string;
  hubLabel?: string;
  activeTypeKey?: string;
  flat?: boolean;
  // "gallery": photo cards (name/handle) instead of a table — used by
  // Creators. Same List View, same data, different rendering, per the
  // Template G gallery pattern already used for Creative Library.
  variant?: "table" | "gallery";
  cardPhotoKey?: string;
  cardSubtitleKey?: string;
}) {
  const library = await getLibraryByKey(libraryKey);

  if (!library) {
    // In flat mode the libraryKey is hardcoded by the route, not a URL
    // param — a miss here means the schema/seed hasn't been run yet, not
    // a genuine 404, so show the same honest empty state the mini-hubs
    // use instead of a blank Next.js not-found page.
    if (flat) {
      return (
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
            Not set up yet. Run the matching schema/seed file in the
            Supabase SQL Editor to create this collection.
          </div>
        </div>
      );
    }
    notFound();
  }

  const entryTypes = await getEntryTypesForLibrary(library.id);
  const activeType = entryTypes.find((t) => t.key === activeTypeKey);

  const entries = await getEntriesForLibrary(library.id, {
    entryTypeId: activeType?.id,
  });

  const listHref = flat ? basePath : `${basePath}/${library.key}`;
  const newHref = `${listHref}/new`;
  const entryHref = (id: string) => `${listHref}/${id}`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          {!flat && (
            <Link
              href={basePath}
              className="text-sm text-muted hover:text-accent"
            >
              ← {hubLabel}
            </Link>
          )}
          <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
            <span aria-hidden>{library.icon}</span> {library.name}
          </h1>
          <p className="mt-1 text-sm text-muted">{library.description}</p>
        </div>
        <Link
          href={newHref}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          New entry
        </Link>
      </div>

      {entryTypes.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href={listHref}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              !activeType
                ? "bg-accent text-white"
                : "bg-surface text-muted hover:bg-accent/5"
            }`}
          >
            All
          </Link>
          {entryTypes.map((t) => (
            <Link
              key={t.id}
              href={`${listHref}?type=${t.key}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                activeType?.id === t.id
                  ? "bg-accent text-white"
                  : "bg-surface text-muted hover:bg-accent/5"
              }`}
            >
              {t.name}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6">
        {entries === null ? (
          <p className="text-sm text-muted">
            Couldn&apos;t load entries. Check that this module&apos;s schema
            has been run in Supabase.
          </p>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/mushroom.svg"
              alt=""
              className="mx-auto mb-3 h-12 w-12 opacity-70"
            />
            No entries yet.{" "}
            <Link href={newHref} className="text-accent hover:underline">
              Create the first one
            </Link>
            .
          </div>
        ) : variant === "gallery" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {entries.map((e) => {
              const photo = cardPhotoKey
                ? e.structured_fields[cardPhotoKey]
                : undefined;
              const subtitle = cardSubtitleKey
                ? e.structured_fields[cardSubtitleKey]
                : undefined;
              const initial = e.title.trim().charAt(0).toUpperCase() || "?";

              return (
                <Link
                  key={e.id}
                  href={entryHref(e.id)}
                  className="flex flex-col items-center rounded-xl border border-border bg-surface p-4 text-center transition hover:border-accent/40 hover:bg-accent/5"
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo}
                      alt={e.title}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-soft/30 text-2xl font-semibold text-accent">
                      {initial}
                    </div>
                  )}
                  <p className="mt-3 font-medium text-foreground">{e.title}</p>
                  {subtitle && (
                    <p className="text-sm text-muted">{subtitle}</p>
                  )}
                  <span
                    className={`mt-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[e.status] ?? STATUS_STYLES.draft
                    }`}
                  >
                    {e.status}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-medium text-foreground">
                      <Link
                        href={entryHref(e.id)}
                        className="hover:text-accent hover:underline"
                      >
                        {e.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-muted">{e.entry_type.name}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_STYLES[e.status] ?? STATUS_STYLES.draft
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted">
                      {formatDate(e.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
