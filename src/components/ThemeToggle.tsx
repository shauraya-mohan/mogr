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
 * Sun / moon theme toggle. The initial theme is set before paint by the
 * inline script in layout.tsx (no flash); this component syncs React state
 * to that DOM attribute, then owns toggling + persistence afterwards.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  // Adopt whatever the no-flash script already applied.
  useEffect(() => setTheme(readTheme()), []);

  function apply(next: Theme) {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("mogr-theme", next);
    } catch {
      /* storage may be unavailable (private mode) — non-fatal */
    }
    // Pinned/scroll-triggered layouts shift when the theme changes.
    window.ScrollTrigger?.refresh();
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label="Toggle dark mode"
      aria-pressed={theme === "dark"}
      onClick={() => apply(theme === "dark" ? "light" : "dark")}
    >
      <svg
        className="theme-icon theme-icon--sun"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.2v2.4M12 19.4v2.4M4.6 4.6l1.7 1.7M17.7 17.7l1.7 1.7M2.2 12h2.4M19.4 12h2.4M4.6 19.4l1.7-1.7M17.7 6.3l1.7-1.7" />
      </svg>
      <svg
        className="theme-icon theme-icon--moon"
        viewBox="0 0 24 24"
        width="19"
        height="19"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20 14.2A8 8 0 1 1 9.8 4a6.4 6.4 0 0 0 10.2 10.2z" />
      </svg>
    </button>
  );
}
