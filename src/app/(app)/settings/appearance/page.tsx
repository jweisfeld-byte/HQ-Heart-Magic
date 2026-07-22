import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserAppearanceSettings } from "@/lib/settings/queries";
import {
  updateRainbowGlowAction,
  uploadDashboardBackgroundAction,
  resetDashboardBackgroundAction,
} from "@/app/(app)/settings/actions";
import { ThemeToggle } from "@/components/settings/ThemeToggle";

// Template F, same shape as the other Settings screens. Jacob's ask:
// a way to turn the rainbow border-glow effect off without asking me,
// and a way to swap the dashboard's background photo for his own —
// and, per his later ask, scoped to just the logged-in person rather
// than shared across everybody's HQ.
export default async function AppearanceSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const org = await getUserAppearanceSettings(user.email);

  if (!org) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
        Not set up yet. Run{" "}
        <code className="text-xs">supabase/user_appearance_schema.sql</code>{" "}
        in the Supabase SQL Editor to add the per-user appearance table.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Appearance
        </p>
        <p className="mt-1 text-sm text-muted">
          System follows your device&apos;s light/dark setting. Choose Light
          or Dark to override it just in this browser.
        </p>
        <div className="mt-3">
          <ThemeToggle />
        </div>
      </div>

      <form
        action={updateRainbowGlowAction}
        className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <label
              htmlFor="rainbowGlowEnabled"
              className="text-sm font-medium text-foreground"
            >
              Rainbow border glow
            </label>
            <p className="mt-1 text-sm text-muted">
              The slow-moving rainbow ring around cards and tiles, just for
              you. Turn it off for plain borders — nobody else&apos;s view
              changes.
            </p>
          </div>
          <input
            id="rainbowGlowEnabled"
            name="rainbowGlowEnabled"
            type="checkbox"
            defaultChecked={org.rainbow_glow_enabled}
            className="mt-1 h-5 w-5 shrink-0 accent-accent"
          />
        </div>

        <div>
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Save
          </button>
        </div>
      </form>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <span className="text-sm font-medium text-foreground">
            Dashboard background photo
          </span>
          <p className="mt-1 text-sm text-muted">
            Shown full-bleed behind your own dashboard only. Defaults to the
            snow-capped mountain photo until you upload your own.
          </p>
        </div>

        {org.dashboard_background_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={org.dashboard_background_url}
            alt="Current dashboard background"
            className="h-32 w-full rounded-lg object-cover"
          />
        ) : (
          <p className="text-xs text-muted">
            Currently using the default mountain photo.
          </p>
        )}

        <form
          action={uploadDashboardBackgroundAction}
          encType="multipart/form-data"
          className="flex flex-wrap items-center gap-3"
        >
          <input
            type="file"
            name="file"
            accept="image/*"
            required
            className="text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Upload
          </button>
        </form>

        {org.dashboard_background_url ? (
          <form action={resetDashboardBackgroundAction}>
            <button
              type="submit"
              className="text-xs font-medium text-muted underline hover:text-foreground"
            >
              Reset to default mountain photo
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
