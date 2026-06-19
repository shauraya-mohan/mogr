"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/dashboard/data";
import { NAV_ICONS } from "@/components/dashboard/icons";

const ITEM_ROUTES: Record<string, string> = {
  dashboard: "/dashboard",
  scans: "/scan",
};

export default function ConsoleSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-4">
      {NAV_ITEMS.map((item) => {
        const route = ITEM_ROUTES[item as keyof typeof ITEM_ROUTES];
        const Icon = NAV_ICONS[item];
        
        // Check if this item is active. If the pathname matches the route, or if
        // we are on /hair, make sure nothing or dashboard is highlighted appropriately.
        // For dashboard, it's active on /dashboard. For scans, active on /scan.
        const active = route ? pathname === route : false;

        if (!route) {
          return (
            <button
              key={item}
              type="button"
              className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 font-mono text-[14px] tracking-[0.01em] text-[#8E897D]/50 cursor-not-allowed"
              disabled
            >
              {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
              {item}
            </button>
          );
        }

        return (
          <Link
            key={item}
            href={route}
            aria-current={active ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 font-mono text-[14px] tracking-[0.01em] transition-colors ${
              active
                ? "bg-white/[0.07] text-[#F4F2EC]"
                : "text-[#8E897D] hover:text-[#F4F2EC]"
            }`}
          >
            {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
            {item}
          </Link>
        );
      })}
    </nav>
  );
}
