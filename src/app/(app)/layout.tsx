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
        <header className="flex items-center justify-end border-b border-border bg-surface px-6 py-3">
          <div className="flex items-center gap-3 text-sm text-muted">
            <span>{user.email}</span>
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 bg-background px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
