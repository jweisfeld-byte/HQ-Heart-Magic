import { LibraryListPage } from "@/components/knowledge/LibraryListPage";

// Single-collection destination — no mini-hub in front of it (Application
// Architecture v1 Section 4). Rendered as photo cards (Template G gallery)
// rather than a table, since Creator Profile entries carry a photo/handle.
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
      variant="gallery"
      cardPhotoKey="photo_url"
      cardSubtitleKey="handle"
    />
  );
}
