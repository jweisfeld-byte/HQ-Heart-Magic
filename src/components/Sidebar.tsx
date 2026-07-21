"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// iconSrc (a brand SVG from /public/icons) takes priority over the emoji
// fallback when present — only sections with a natural match to one of
// the hand-drawn HM brand icons get one; the rest keep their emoji.
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠", iconSrc: "/icons/flower-of-life.svg" },
  { href: "/tasks", label: "Tasks", icon: "✅" },
  { href: "/projects", label: "Projects", icon: "🔺" },
  { href: "/knowledge", label: "Knowledge", icon: "🧠" },
  { href: "/marketing", label: "Marketing", icon: "🎯" },
  { href: "/creative", label: "Creative", icon: "🎥" },
  { href: "/creators", label: "Creators", icon: "🤝" },
  { href: "/analytics", label: "Analytics", icon: "📊" },
  { href: "/experiments", label: "Experiments", icon: "🧪", iconSrc: "/icons/lightning.svg" },
  { href: "/wholesale", label: "Wholesale", icon: "📦" },
  { href: "/events", label: "Events", icon: "📅" },
];

// Kept separate from NAV_ITEMS so it can be pinned to the bottom of the
// sidebar (Jacob's ask) instead of just being last in the scrolling list.
const SETTINGS_ITEM = { href: "/settings", label: "Settings", icon: "⚙️" };

type NavItem = {
  href: string;
  label: string;
  icon: string;
  iconSrc?: string;
};

export function Sidebar() {
  const pathname = usePathname();

  // Every pill stays the same size. The active/current-page pill shows
  // the app-wide rotating-rainbow-ring effect permanently (`.border-border`,
  // gated by Settings > Appearance); every other pill shows that same
  // ring only while actually hovered (`.glow-hover`), rather than a
  // solid accent-colored fill.
  function renderItem(item: NavItem) {
    const active =
      pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={`flex items-center gap-2.5 rounded-full border px-3 py-2 text-[16.8px] font-medium transition-colors duration-200 ease-out ${
            active
              ? "border-border text-accent"
              : "glow-hover border-[color:var(--color-border)] text-foreground/80 hover:text-accent"
          }`}
        >
          {item.iconSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.iconSrc} alt="" className="h-4 w-4" />
          ) : (
            <span aria-hidden>{item.icon}</span>
          )}
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <nav className="flex h-full w-60 flex-col border-r border-border bg-surface px-3 py-6">
      <div className="px-3 pb-6">
        <span className="font-display text-lg font-semibold text-foreground">
          Heart Magic HQ
        </span>
      </div>
      <ul className="flex flex-1 flex-col gap-2.5">
        {NAV_ITEMS.map((item) => renderItem(item))}
      </ul>
      <ul className="flex flex-col gap-2.5 pt-3">
        {renderItem(SETTINGS_ITEM)}
      </ul>
    </nav>
  );
}
