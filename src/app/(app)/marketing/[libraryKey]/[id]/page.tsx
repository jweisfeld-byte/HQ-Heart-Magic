import { EntryDetailFormPage } from "@/components/knowledge/EntryDetailFormPage";

export default async function MarketingEntryDetailPage({
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
      basePath="/marketing"
      edit={Boolean(edit)}
    />
  );
}
