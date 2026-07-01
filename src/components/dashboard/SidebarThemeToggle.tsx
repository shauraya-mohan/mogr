"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light"
    ? "light"
    : "dark";
}

/**
 * Light/dark toggle for the console sidebar. The sidebar chrome is always
 * dark (both themes), so — unlike the token-driven `.theme-toggle` — this
 * uses fixed light-on-dark colours (mirrors the prototype's `.app-theme`).
 * Reuses the same `data-theme` + `mogr-theme` apply logic as ThemeToggle.
 */
export default function SidebarThemeToggle({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [theme, setTheme] = useState<Theme>("dark");

  // Adopt whatever the no-flash script already applied.
  useEffect(() => setTheme(readTheme()), []);

  function apply(next: Theme) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("mogr-theme", next);
    } catch {
      /* storage may be unavailable — non-fatal */
    }
    window.ScrollTrigger?.refresh();
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      aria-pressed={isDark}
      title={isDark ? "Switch to light" : "Switch to dark"}
      onClick={() => apply(isDark ? "light" : "dark")}
      className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-white/[0.12] text-[#8E897D] transition-colors hover:border-[#C68A47] hover:text-[#C68A47]"
    >
      {isDark ? (
        <svg
          viewBox="0 0 24 24"
          width={compact ? 17 : 18}
          height={compact ? 17 : 18}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.2v2.4M12 19.4v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.2 12h2.4M19.4 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          width={compact ? 16 : 17}
          height={compact ? 16 : 17}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 14.2A8 8 0 1 1 9.8 4a6.4 6.4 0 0 0 10.2 10.2z" />
        </svg>
      )}
    </button>
  );
}
