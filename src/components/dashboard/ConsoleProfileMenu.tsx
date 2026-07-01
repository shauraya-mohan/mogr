"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

/**
 * Avatar button that reveals the single logout action. Used in the console
 * sidebar (popover opens upward, with a "profile" label) and the mobile top
 * bar (compact, popover opens downward). This is the ONLY logout in the app.
 */
export default function ConsoleProfileMenu({
  initials,
  variant = "sidebar",
  collapsed = false,
}: {
  initials: string;
  variant?: "sidebar" | "topbar";
  /** Sidebar-only: render the avatar without the "profile" label. */
  collapsed?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sidebar = variant === "sidebar";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className={`relative ${sidebar && !collapsed ? "flex-1" : ""}`}>
      {open && (
        <div
          className={`absolute z-50 min-w-[170px] rounded-[12px] border border-white/[0.08] bg-[#232320] p-1.5 shadow-[0_16px_44px_-12px_rgba(0,0,0,0.65)] ${
            sidebar
              ? `bottom-full mb-2 ${collapsed ? "left-0" : "left-0 w-full"}`
              : "right-0 top-full mt-2"
          }`}
          role="menu"
        >
          <button
            type="button"
            onClick={logout}
            role="menuitem"
            className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-left font-mono text-[13px] text-[#E9E5DB] transition-colors hover:bg-white/[0.07]"
          >
            <LogoutIcon />
            Log out
          </button>
        </div>
      )}

      {sidebar ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={collapsed ? "Profile menu" : undefined}
          title={collapsed ? "Profile" : undefined}
          className={`flex items-center rounded-[10px] text-left transition-colors hover:bg-white/[0.05] ${
            collapsed ? "justify-center p-1.5" : "w-full gap-3 px-3 py-3"
          }`}
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-bronze font-mono text-[12px] font-bold text-[#1A1A16]">
            {initials}
          </span>
          {!collapsed && (
            <span className="font-mono text-[14px] text-[#8E897D]">profile</span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="Profile menu"
          className="grid h-8 w-8 place-items-center rounded-full bg-bronze font-mono text-[11px] font-bold text-[#1A1A16]"
        >
          {initials}
        </button>
      )}
    </div>
  );
}
