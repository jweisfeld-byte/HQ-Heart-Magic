import { LibraryListPage } from "@/components/knowledge/LibraryListPage";

export default async function CreativeLibraryPage({
  params,
  searchParams,
}: {
  params: Promise<{ libraryKey: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { libraryKey } = await params;
  const { type } = await searchParams;

  return (
    <LibraryListPage
      libraryKey={libraryKey}
      basePath="/creative"
      hubLabel="Creative"
      activeTypeKey={type}
    />
  );
}
