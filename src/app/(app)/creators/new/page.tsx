import { NewEntryFormPage } from "@/components/knowledge/NewEntryFormPage";
import { CREATOR_PROFILE_FIELDS } from "@/lib/knowledge/fieldSchemas";

export default function NewCreatorEntryPage() {
  return (
    <NewEntryFormPage
      libraryKey="creator-knowledge"
      basePath="/creators"
      flat
      fieldSchema={CREATOR_PROFILE_FIELDS}
    />
  );
}
