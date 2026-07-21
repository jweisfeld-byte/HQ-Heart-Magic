import { NewEntryFormPage } from "@/components/knowledge/NewEntryFormPage";

export default function NewCreatorEntryPage() {
  return (
    <NewEntryFormPage
      libraryKey="creator-knowledge"
      basePath="/creators"
      flat
    />
  );
}
