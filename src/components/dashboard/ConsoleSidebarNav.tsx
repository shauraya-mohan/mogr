"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/dashboard/data";
import { NAV_ICONS } from "@/components/dashboard/icons";

const ITEM_ROUTES: Record<string, string> = {
  dashboard: "/dashboard",
  scans: "/scans",
  routine: "/routine",
  "your looks": "/wardrobe/looks",
  wardrobe: "/wardrobe",
};

export default function ConsoleSidebarNav({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  // Longest matching route wins so nested routes with a shared prefix
  // (e.g. /wardrobe vs /wardrobe/looks) light up only the closer item.
  const routes = Object.values(ITEM_ROUTES);
  const matchingRoutes = routes.filter(
    (r) => pathname === r || pathname.startsWith(`${r}/`)
  );
  const closestRoute = matchingRoutes.reduce(
    (a, b) => (b.length > a.length ? b : a),
    ""
  );

  return (
    <nav className={`flex-1 space-y-1 ${collapsed ? "px-2" : "px-4"}`}>
      {NAV_ITEMS.map((item) => {
        const route = ITEM_ROUTES[item as keyof typeof ITEM_ROUTES];
        const Icon = NAV_ICONS[item];

        const active = route === closestRoute;

        const shared = `flex w-full items-center rounded-[10px] font-mono text-[14px] tracking-[0.01em] transition-colors ${
          collapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"
        }`;

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
            {Icon && (
              <Icon
                className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                  active ? "text-[#C68A47]" : ""
                }`}
              />
            )}
            {!collapsed && item}
          </Link>
        );
      })}
    </nav>
  );
}
