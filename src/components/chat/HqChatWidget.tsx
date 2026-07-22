"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ChatMessage } from "@/lib/chat/queries";

/**
 * Floating chat widget available on every page (Jacob's ask: a Claude
 * chat that can pull from everything in HQ). Read-only — it only ever
 * answers questions, never takes actions elsewhere in the app.
 *
 * Rendered via a portal straight to document.body, same fix applied to
 * the Meta ad picker modal: this app's rainbow-glow CSS
 * (.border-border { position: relative; isolation: isolate; }) breaks
 * position:fixed containment for anything nested inside a bordered
 * card, so a portal is the reliable way to keep this pinned to the
 * actual viewport regardless of where it's mounted in the tree.
 */
export function HqChatWidget({
  initialMessages,
}: {
  initialMessages: ChatMessage[];
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  function send() {
    const message = input.trim();
    if (!message || sending) return;

    setError(null);
    setInput("");
    setSending(true);

    const optimisticUser: ChatMessage = {
      id: `local-${Date.now()}`,
      user_email: "",
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
          return;
        }
        const assistantMsg: ChatMessage = {
          id: `local-${Date.now()}-a`,
          user_email: "",
          role: "assistant",
          content: json.reply,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      })
      .catch(() => setError("Couldn't reach the assistant — try again."))
      .finally(() => setSending(false));
  }

  function handleClear() {
    setMessages([]);
    fetch("/api/chat", { method: "DELETE" }).catch(() => {});
  }

  const button = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-white shadow-lg hover:opacity-90"
      aria-label="Ask HQ assistant"
    >
      {open ? "×" : "💬"}
    </button>
  );

  const panel = open && (
    <div className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-96 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="font-display text-sm font-semibold text-foreground">
            HQ Assistant
          </p>
          <p className="text-xs text-muted">
            Answers grounded in Tasks, Projects, Funnels, Wholesale, Events &amp; Knowledge.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="shrink-0 text-xs text-muted hover:text-red-600"
        >
          Clear
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted">
            Ask me anything about what&apos;s going on in HQ — e.g. &ldquo;what
            tasks are overdue?&rdquo; or &ldquo;how&apos;s the Iced Cacao funnel
            doing?&rdquo; I only answer questions — I won&apos;t change
            anything in HQ myself.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={
                  m.role === "user"
                    ? "ml-8 rounded-lg bg-accent/10 px-3 py-2 text-sm text-foreground"
                    : "mr-4 rounded-lg bg-background px-3 py-2 text-sm text-foreground"
                }
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
          </div>
        )}
        {sending && <p className="mt-2 text-xs text-muted">Thinking…</p>}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      <div className="flex items-center gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask about anything in HQ…"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !input.trim()}
          className="shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      {panel}
      {button}
    </>,
    document.body,
  );
}
