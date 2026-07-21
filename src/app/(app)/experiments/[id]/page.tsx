import { EntryDetailFormPage } from "@/components/knowledge/EntryDetailFormPage";

export default async function ExperimentEntryDetailPage({
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
      libraryKey="experiments"
      id={id}
      basePath="/experiments"
      edit={Boolean(edit)}
      flat
    />
  );
}
