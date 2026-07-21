import { EntryDetailFormPage } from "@/components/knowledge/EntryDetailFormPage";

export default async function CreatorEntryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;

  return (
    <EntryDetailFormPage
      libraryKey="creator-knowledge"
      id={id}
      basePath="/creators"
      edit={Boolean(edit)}
      flat
    />
  );
}
