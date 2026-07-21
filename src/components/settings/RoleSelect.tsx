"use client";

import type { UserRole } from "@/lib/settings/queries";

const ROLES: UserRole[] = ["owner", "admin", "member", "guest"];

// Auto-submits on change — needs to be a Client Component for the
// onChange handler, but the actual mutation is the server action passed
// in from the page (a "use server" reference, not client logic).
export function RoleSelect({
  email,
  role,
  action,
}: {
  email: string;
  role: UserRole;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="inline">
      <input type="hidden" name="email" value={email} />
      <select
        name="role"
        defaultValue={role}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-lg border border-border bg-background px-2 py-1 text-sm text-foreground"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </option>
        ))}
      </select>
    </form>
  );
}
