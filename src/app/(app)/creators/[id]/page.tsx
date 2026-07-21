import { EntryDetailFormPage } from "@/components/knowledge/EntryDetailFormPage";
import { CREATOR_PROFILE_FIELDS } from "@/lib/knowledge/fieldSchemas";

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
      fieldSchema={CREATOR_PROFILE_FIELDS}
      photoFieldKey="photo_url"
      subtitleFieldKey="handle"
    />
  );
}
