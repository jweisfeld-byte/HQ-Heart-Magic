import { NewEntryFormPage } from "@/components/knowledge/NewEntryFormPage";

export default async function NewCreativeEntryPage({
  params,
}: {
  params: Promise<{ libraryKey: string }>;
}) {
  const { libraryKey } = await params;
  return <NewEntryFormPage libraryKey={libraryKey} basePath="/creative" />;
}
