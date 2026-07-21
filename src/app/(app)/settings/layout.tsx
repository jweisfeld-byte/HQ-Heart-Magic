"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Template F (Screens & Flows v1 Section 2): plain, stacked forms, no
// visual novelty. The 4 Settings screens from Section 3 (Integrations,
// Roles & Permissions, Organization, Profile) share this tab nav.
const TABS = [
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/organization", label: "Organization" },
  { href: "/settings/integrations", label: "Integrations" },
  { href: "/settings/roles", label: "Roles & Permissions" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Settings
      </h1>

      <div className="mt-6 flex gap-2 border-b border-border">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                active
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}
