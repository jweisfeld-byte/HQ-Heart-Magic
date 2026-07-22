import { NextRequest, NextResponse } from "next/server";
import { buildWeeklyDigestMessage } from "@/lib/discord/weeklyDigest";
import { postToAllWebhooks } from "@/lib/discord/queries";

// Called weekly by Vercel Cron (see vercel.json). Vercel automatically
// sends "Authorization: Bearer <CRON_SECRET>" on cron-triggered
// requests when a CRON_SECRET env var is set — validated here so this
// endpoint can't be hit by anyone who finds the URL and spam the
// Discord channels with digests.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  const message = await buildWeeklyDigestMessage();
  const results = await postToAllWebhooks(message);

  return NextResponse.json({ message, results });
}
