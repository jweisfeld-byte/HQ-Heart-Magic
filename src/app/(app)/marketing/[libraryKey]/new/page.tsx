import { NewEntryFormPage } from "@/components/knowledge/NewEntryFormPage";

export default async function NewMarketingEntryPage({
  params,
}: {
  params: Promise<{ libraryKey: string }>;
}) {
  const { libraryKey } = await params;
  return <NewEntryFormPage libraryKey={libraryKey} basePath="/marketing" />;
}
