"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/dashboard/data";
import { NAV_ICONS } from "@/components/dashboard/icons";

const ITEM_ROUTES: Record<string, string> = {
  dashboard: "/dashboard",
  scans: "/scans",
  routine: "/routine",
  wardrobe: "/wardrobe",
};

export default function ConsoleSidebarNav({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className={`flex-1 space-y-1 ${collapsed ? "px-2" : "px-4"}`}>
      {NAV_ITEMS.map((item) => {
        const route = ITEM_ROUTES[item as keyof typeof ITEM_ROUTES];
        const Icon = NAV_ICONS[item];

        // Active when the pathname is the route or nested under it
        // (e.g. /wardrobe/style, /wardrobe/scan keep "wardrobe" lit).
        const active = route
          ? pathname === route || pathname.startsWith(`${route}/`)
          : false;

        const shared = `flex items-center rounded-[10px] font-mono text-[14px] tracking-[0.01em] transition-colors ${
          collapsed ? "justify-center px-0 py-2.5" : "w-full gap-3 px-3 py-2.5"
        }`;

        if (!route) {
          return (
            <button
              key={item}
              type="button"
              className={`${shared} cursor-not-allowed text-[#8E897D]/50`}
              disabled
              title={collapsed ? item : undefined}
            >
              {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
              {!collapsed && item}
            </button>
          );
        }

        return (
          <Link
            key={item}
            href={route}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item : undefined}
            className={`${shared} ${
              active
                ? "bg-white/[0.07] text-[#F4F2EC]"
                : "text-[#8E897D] hover:text-[#F4F2EC]"
            }`}
          >
            {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
            {!collapsed && item}
          </Link>
        );
      })}
    </nav>
  );
}
