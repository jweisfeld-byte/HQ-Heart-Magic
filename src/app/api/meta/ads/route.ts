import { NextRequest, NextResponse } from "next/server";
import { listRecentAds } from "@/lib/meta/queries";

// Backs the client-side Meta Ads picker (components/funnels/MetaAdPicker.tsx).
// A plain JSON route rather than a Server Action here because the picker
// needs to fetch on demand (open modal, type to search) rather than on a
// form submit.
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? undefined;
  const ads = await listRecentAds(q);

  if (ads === null) {
    return NextResponse.json(
      { error: "Meta Ads isn't connected yet — see Settings > Integrations." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ads });
}
