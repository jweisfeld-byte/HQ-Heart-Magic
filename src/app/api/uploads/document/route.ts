import { NextRequest, NextResponse } from "next/server";
import { uploadDocument } from "@/lib/uploads/queries";

// Backs both the Knowledge ReferencesEditor and the funnel format
// Drive-attach component's "Upload a file" option — a plain multipart
// route rather than a Server Action since both are client components
// uploading on demand (as soon as a file is chosen), not on a
// surrounding form's own submit.
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const result = await uploadDocument(file);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.document);
}
