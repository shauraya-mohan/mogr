"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ConsoleSidebarNav from "@/components/dashboard/ConsoleSidebarNav";
import ConsoleProfileMenu from "@/components/dashboard/ConsoleProfileMenu";
import SidebarThemeToggle from "@/components/dashboard/SidebarThemeToggle";

const STORAGE_KEY = "mogr-nav-collapsed";

/** The sidebar-panel glyph — reads as "toggle sidebar". Fills to show state. */
function PanelIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" />
      {collapsed && <rect x="3" y="4.5" width="6.5" height="15" rx="2.5" fill="currentColor" stroke="none" />}
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * Console shell — dark sidebar + themed content. Client so the sidebar can
 * collapse (desktop, persisted) and slide in as a drawer (mobile). On mobile
 * the drawer always shows the full expanded nav regardless of the desktop
 * collapse preference.
 */
export default function ConsoleShell({
  initials,
  children,
}: {
  initials: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* non-fatal */
    }
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setDrawerOpen(false), [pathname]);

  // Esc closes the drawer.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  function toggleCollapse() {
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

  // Collapse is a desktop-only concept; the mobile drawer is always expanded.
  const showCollapsed = isDesktop && collapsed;

  return (
    <div className="min-h-screen bg-bone text-ink">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-[#1A1A16] px-4 text-[#F4F2EC] lg:hidden">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="grid h-10 w-10 place-items-center rounded-[10px] text-[#E9E5DB] transition-colors hover:bg-white/[0.06] hover:text-[#C68A47]"
          >
            <MenuIcon />
          </button>
          <Link href="/" className="font-display text-[20px] font-bold tracking-[-0.03em]">
            mogr<span className="text-bronze">.</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <SidebarThemeToggle compact />
          <ConsoleProfileMenu initials={initials} variant="topbar" />
        </div>
      </div>

      {/* Scrim behind the mobile drawer */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-40 bg-[rgba(10,10,8,0.55)] backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden
      />

      {/* Sidebar (drawer on mobile, fixed rail on desktop) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-[#1A1A16] text-[#F1EEE6] transition-[transform,width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:z-40 lg:translate-x-0 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        } w-[256px] ${collapsed ? "lg:w-[72px]" : "lg:w-[256px]"}`}
      >
        {/* Brand + control */}
        <div
          className={`flex pb-6 pt-7 ${
            showCollapsed ? "flex-col items-center gap-4" : "items-center justify-between px-7"
          }`}
        >
          <Link
            href="/"
            aria-label="mogr home"
            className={`font-display font-bold tracking-[-0.03em] text-[#F4F2EC] ${
              showCollapsed ? "text-[24px]" : "text-[26px]"
            }`}
          >
            {showCollapsed ? "m" : "mogr"}
            <span className="text-[#C68A47]">.</span>
          </Link>
          {/* desktop: collapse toggle */}
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            className="hidden h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] text-[#8E897D] transition-colors hover:bg-white/[0.06] hover:text-[#C68A47] lg:grid"
          >
            <PanelIcon collapsed={collapsed} />
          </button>
          {/* mobile: close drawer */}
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] text-[#8E897D] transition-colors hover:bg-white/[0.06] hover:text-[#C68A47] lg:hidden"
          >
            <CloseIcon />
          </button>
        </div>

        <ConsoleSidebarNav collapsed={showCollapsed} />

        {/* Footer: profile + theme */}
        <div
          className={`m-4 flex gap-2 ${
            showCollapsed ? "flex-col items-center" : "items-center justify-between"
          }`}
        >
          <ConsoleProfileMenu initials={initials} collapsed={showCollapsed} />
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
