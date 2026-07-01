"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ConsoleSidebarNav from "@/components/dashboard/ConsoleSidebarNav";
import ConsoleProfileMenu from "@/components/dashboard/ConsoleProfileMenu";
import SidebarThemeToggle from "@/components/dashboard/SidebarThemeToggle";

const STORAGE_KEY = "mogr-nav-collapsed";

/** The sidebar-panel glyph — reads as "toggle sidebar". The inner column
 *  fills when collapsed, so the icon itself reflects the current state. */
function PanelIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
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
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" />
      {collapsed && <rect x="3" y="4.5" width="6.5" height="15" rx="2.5" fill="currentColor" stroke="none" />}
    </svg>
  );
}

/**
 * Console shell — the dark sidebar + themed content area for all logged-in
 * sections. Client component so the sidebar can be collapsed (persisted) and
 * carry a light/dark toggle. Auth/initials are resolved server-side in
 * (console)/layout.tsx and passed in.
 */
export default function ConsoleShell({
  initials,
  children,
}: {
  initials: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  // Adopt the persisted preference after mount (server renders expanded).
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* non-fatal */
    }
  }, []);

  function toggle() {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* non-fatal */
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-bone text-ink">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between bg-[#1A1A16] px-5 text-[#F4F2EC] lg:hidden">
        <Link href="/" className="font-display text-[20px] font-bold tracking-[-0.03em]">
          mogr<span className="text-bronze">.</span>
        </Link>
        <div className="flex items-center gap-2">
          <SidebarThemeToggle compact />
          <ConsoleProfileMenu initials={initials} variant="topbar" />
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/[0.06] bg-[#1A1A16] text-[#F1EEE6] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex ${
          collapsed ? "w-[72px]" : "w-[256px]"
        }`}
      >
        {/* Brand + collapse control */}
        <div
          className={`flex pb-6 pt-7 ${
            collapsed ? "flex-col items-center gap-4" : "items-center justify-between px-7"
          }`}
        >
          <Link
            href="/"
            aria-label="mogr — home"
            className={`font-display font-bold tracking-[-0.03em] text-[#F4F2EC] ${
              collapsed ? "text-[24px]" : "text-[26px]"
            }`}
          >
            {collapsed ? "m" : "mogr"}
            <span className="text-[#C68A47]">.</span>
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            title={collapsed ? "Expand" : "Collapse"}
            className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] text-[#8E897D] transition-colors hover:bg-white/[0.06] hover:text-[#C68A47]"
          >
            <PanelIcon collapsed={collapsed} />
          </button>
        </div>

        <ConsoleSidebarNav collapsed={collapsed} />

        {/* Footer: profile + theme */}
        <div
          className={`m-4 flex gap-2 ${
            collapsed ? "flex-col items-center" : "items-center justify-between"
          }`}
        >
          <ConsoleProfileMenu initials={initials} collapsed={collapsed} />
          <SidebarThemeToggle />
        </div>
      </aside>

      {/* Main */}
      <main
        className={`transition-[margin] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          collapsed ? "lg:ml-[72px]" : "lg:ml-[256px]"
        }`}
      >
        <div className="mx-auto max-w-[1080px] px-[clamp(20px,4vw,56px)] py-[clamp(28px,5vh,56px)]">
          {children}
        </div>
      </main>
    </div>
  );
}
