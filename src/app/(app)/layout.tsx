import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { SignOutButton } from "@/components/SignOutButton";
import { getOrganizationSettings, getUserAppearanceSettings } from "@/lib/settings/queries";
import { getChatHistory } from "@/lib/chat/queries";
import { HqChatWidget } from "@/components/chat/HqChatWidget";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Rainbow border glow is personal to whoever is logged in (Jacob's
  // ask) — read from the current user's own appearance row, defaulting
  // to on (matching the effect's original always-on behavior) if it's
  // never been set. Team Calendar link stays org-wide since it's a
  // genuinely shared resource.
  const [org, userAppearance, chatHistory] = await Promise.all([
    getOrganizationSettings(),
    user.email ? getUserAppearanceSettings(user.email) : Promise.resolve(null),
    user.email ? getChatHistory(user.email) : Promise.resolve([]),
  ]);
  const glowEnabled = userAppearance ? userAppearance.rainbow_glow_enabled : true;
  const teamCalendarUrl = org?.team_calendar_url ?? null;

  return (
    <div className={`flex h-screen w-full ${glowEnabled ? "glow-enabled" : ""}`}>
      <Sidebar teamCalendarUrl={teamCalendarUrl} />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-surface px-6 py-3">
          {/* AI Search, available from every page, not just its own route
              (Jacob's ask) — plain GET form so it works with zero JS,
              lands on /search?q=... with the same results page. */}
          <form
            action="/search"
            method="get"
            className="flex w-full max-w-md items-center gap-2"
          >
            <span aria-hidden className="text-muted">
              🔍
            </span>
            <input
              name="q"
              type="text"
              placeholder="Ask AI Search anything..."
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
            />
          </form>
          <div className="flex shrink-0 items-center gap-3 text-sm text-muted">
            <span>{user.email}</span>
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 bg-background px-8 py-8">{children}</main>
      </div>
      {/* Floating HQ Assistant, available on every page (Jacob's ask) —
          read-only, grounded in everything across HQ. */}
      <HqChatWidget initialMessages={chatHistory} />
    </div>
  );
}
