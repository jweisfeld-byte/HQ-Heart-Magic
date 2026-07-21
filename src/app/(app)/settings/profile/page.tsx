import { createClient } from "@/lib/supabase/server";

// Template F. Account info is managed by Google (Sign-in v1, Section
// 1) — nothing here is editable except the local display preference,
// which is exactly what Screens & Flows v1's Template F list calls
// "Profile: Personal preferences." Notification settings aren't built
// yet (no notification system exists in the app), so that section is
// left out rather than faked.
export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "—";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Account
        </p>
        <div className="mt-3 flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft/30 text-xl font-semibold text-accent">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{name}</p>
            <p className="text-sm text-muted">{user?.email}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          Managed by your Google Workspace account — signed in via SSO, not
          editable here.
        </p>
      </div>

    </div>
  );
}
