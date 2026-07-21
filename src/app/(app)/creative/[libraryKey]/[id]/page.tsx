import { EntryDetailFormPage } from "@/components/knowledge/EntryDetailFormPage";

export default async function CreativeEntryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ libraryKey: string; id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { libraryKey, id } = await params;
  const { edit } = await searchParams;

  return (
    <EntryDetailFormPage
      libraryKey={libraryKey}
      id={id}
      basePath="/creative"
      edit={Boolean(edit)}
    />
  );
}
