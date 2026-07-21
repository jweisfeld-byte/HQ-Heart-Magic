"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/knowledge", label: "Knowledge", icon: "🧠" },
  { href: "/marketing", label: "Marketing", icon: "🎯" },
  { href: "/creative", label: "Creative", icon: "🎥" },
  { href: "/creators", label: "Creators", icon: "🤝" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/experiments", label: "Experiments", icon: "🧪" },
  { href: "/wholesale", label: "Wholesale", icon: "📦" },
  { href: "/tasks", label: "Tasks", icon: "✅" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-60 flex-col border-r border-border bg-surface px-3 py-6">
      <div className="px-3 pb-6">
        <span className="font-display text-lg font-semibold text-foreground">
          Heart Magic HQ
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-accent/10 text-accent"
                    : "text-foreground/80 hover:bg-accent/5"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
