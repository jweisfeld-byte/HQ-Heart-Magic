import { LibraryListPage } from "@/components/knowledge/LibraryListPage";

// Single-collection destination — no mini-hub in front of it (Application
// Architecture v1 Section 4).
export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;

  return (
    <LibraryListPage
      libraryKey="creator-knowledge"
      basePath="/creators"
      activeTypeKey={type}
      flat
    />
  );
}
