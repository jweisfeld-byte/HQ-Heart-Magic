import Link from "next/link";
import {
  getEntryCountsByLibrary,
  getLibrariesByGroup,
} from "@/lib/knowledge/queries";

// Shared mini-hub (Template G): N cards, one per collection in a group,
// each linking into that collection's List View. Used by /knowledge,
// /marketing, and (later) /creative — same engine, different config
// (Application Architecture v1, Sections 1 and 4).
export async function HubPage({
  groupKey,
  basePath,
  title,
  subtitle,
  emptyHint,
}: {
  groupKey: string;
  basePath: string;
  title: string;
  subtitle: string;
  emptyHint: React.ReactNode;
}) {
  const libraries = await getLibrariesByGroup(groupKey);

  if (!libraries || libraries.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
        <div className="mt-8 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
          {emptyHint}
        </div>
      </div>
    );
  }

  const counts = await getEntryCountsByLibrary(libraries.map((l) => l.id));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted">{subtitle}</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {libraries.map((lib) => {
          const count = counts[lib.id] ?? 0;
          return (
            <Link
              key={lib.id}
              href={`${basePath}/${lib.key}`}
              className="rounded-xl border border-border bg-surface p-5 transition hover:border-accent/40 hover:bg-accent/5"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl" aria-hidden>
                  {lib.icon}
                </span>
                <span className="rounded-full bg-accent-soft/30 px-2.5 py-0.5 text-xs font-medium text-accent">
                  {count} {count === 1 ? "entry" : "entries"}
                </span>
              </div>
              <h2 className="mt-3 font-display text-base font-semibold text-foreground">
                {lib.name}
              </h2>
              <p className="mt-1 text-sm text-muted">{lib.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
