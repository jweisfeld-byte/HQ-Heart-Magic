import { getUserRoles, listWorkspaceUsers } from "@/lib/settings/queries";
import { updateUserRoleAction } from "@/app/(app)/settings/actions";
import { RoleSelect } from "@/components/settings/RoleSelect";

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Template F, custom table (RoleAssignmentRow — Screens & Flows v1
// Section 7). Real directory (every Workspace user who has actually
// signed in, via Supabase Auth), but the role picked here is a label,
// not enforcement — nothing in the app currently gates a page or action
// by role. Said plainly rather than implying access control that
// doesn't exist yet.
export default async function RolesSettingsPage() {
  const users = await listWorkspaceUsers();

  if (!users) {
    return (
      <p className="text-sm text-muted">
        Couldn&apos;t load the user directory. Check that the service role
        key is configured.
      </p>
    );
  }

  const roles = await getUserRoles();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Roles here are a directory label — a record of who&apos;s an Owner,
        Admin, Member, or Guest. They don&apos;t yet restrict what anyone can
        see or do; every signed-in Workspace user currently has the same
        access.
      </p>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Last signed in</th>
              <th className="px-4 py-2 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2 font-medium text-foreground">
                  {u.email}
                </td>
                <td className="px-4 py-2 text-muted">
                  {formatDate(u.lastSignInAt)}
                </td>
                <td className="px-4 py-2">
                  <RoleSelect
                    email={u.email}
                    role={roles[u.email] ?? "member"}
                    action={updateUserRoleAction}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
