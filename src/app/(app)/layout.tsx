import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { SignOutButton } from "@/components/SignOutButton";

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

  return (
    <div className="flex h-screen w-full">
      <Sidebar />
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
    </div>
  );
}
