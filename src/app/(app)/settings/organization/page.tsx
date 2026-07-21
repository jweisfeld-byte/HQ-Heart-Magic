import { getOrganizationSettings } from "@/lib/settings/queries";
import { updateOrganizationAction } from "@/app/(app)/settings/actions";

// Template F. Single-tenant today, so this is one settings row rather
// than a multi-org switcher — Screens & Flows v1 calls this screen "Org
// name, defaults."
export default async function OrganizationSettingsPage() {
  const org = await getOrganizationSettings();

  if (!org) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
        Not set up yet. Run{" "}
        <code className="text-xs">supabase/settings_schema.sql</code> in the
        Supabase SQL Editor to create the organization settings row.
      </div>
    );
  }

  return (
    <form
      action={updateOrganizationAction}
      className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5"
    >
      <input type="hidden" name="id" value={org.id} />

      <div>
        <label className="text-sm font-medium text-foreground">
          Organization name
        </label>
        <input
          name="name"
          required
          defaultValue={org.name}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">
          Default currency
        </label>
        <input
          name="defaultCurrency"
          defaultValue={org.default_currency}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          placeholder="USD"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">
          Timezone
        </label>
        <input
          name="timezone"
          defaultValue={org.timezone}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          placeholder="America/Chicago"
        />
      </div>

      <div className="mt-2">
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Save
        </button>
      </div>
    </form>
  );
}
