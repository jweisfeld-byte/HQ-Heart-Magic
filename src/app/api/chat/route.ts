import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChatHistory, appendChatMessage, clearChatHistory } from "@/lib/chat/queries";
import { buildHqSnapshot } from "@/lib/chat/snapshot";
import { generateChatReply } from "@/lib/chat/ai";

// Backs the floating chat widget (components/chat/HqChatWidget.tsx) — a
// plain JSON route rather than a Server Action since the widget needs
// to send messages and render replies incrementally, not on a form
// submit. Read-only: this route only ever answers questions, it never
// mutates anything else in HQ (Jacob confirmed Q&A-only for now).
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const history = await getChatHistory(user.email);
  const snapshot = await buildHqSnapshot(message);
  const reply = await generateChatReply(history, snapshot, message);

  if (!reply) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY isn't configured yet — see Settings." },
      { status: 400 },
    );
  }

  await appendChatMessage(user.email, "user", message);
  await appendChatMessage(user.email, "assistant", reply);

  return NextResponse.json({ reply });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  await clearChatHistory(user.email);
  return NextResponse.json({ ok: true });
}
