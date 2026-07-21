import { EntryDetailFormPage } from "@/components/knowledge/EntryDetailFormPage";

export default async function AnalyticsEntryDetailPage({
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
      libraryKey="analytics"
      id={id}
      basePath="/analytics"
      edit={Boolean(edit)}
      flat
    />
  );
}
