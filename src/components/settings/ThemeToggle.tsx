"use client";

import { useEffect, useState } from "react";

type ThemePreference = "system" | "light" | "dark";

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// Reads/writes the same "hm-theme" localStorage key the anti-flash
// script in the root layout checks before first paint.
export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    // One-time read from an external system (localStorage) on mount, to
    // reflect whatever the anti-flash script in the root layout already
    // applied to the DOM before React hydrated.
    const stored = localStorage.getItem("hm-theme");
    if (stored === "light" || stored === "dark") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreference(stored);
    }
  }, []);

  function choose(value: ThemePreference) {
    setPreference(value);
    if (value === "system") {
      localStorage.removeItem("hm-theme");
      document.documentElement.removeAttribute("data-theme");
    } else {
      localStorage.setItem("hm-theme", value);
      document.documentElement.setAttribute("data-theme", value);
    }
  }

  return (
    <div className="flex gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => choose(opt.value)}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
            preference === opt.value
              ? "border-accent bg-accent text-white"
              : "border-border bg-surface text-foreground hover:bg-accent/5"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
