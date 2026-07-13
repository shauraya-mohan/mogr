import type { SVGProps } from "react";
import type { CategoryKey } from "@/lib/dashboard/data";

type Icon = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

/* ---- Category icons (dashboard quick cards) ---- */

/* Duotone: a soft currentColor fill under the stroke gives the marks weight and
   depth (reads crafted, not a hollow line icon), and stays theme-aware. */
export function SkinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path
        d="M12 5c3.1 3.6 5.1 6.2 5.1 8.9a5.1 5.1 0 0 1-10.2 0c0-2.7 2-5.3 5.1-8.9z"
        fill="currentColor"
        fillOpacity={0.16}
      />
      <path d="M9.3 15.2a2.7 2.7 0 0 0 2.2 2.2" />
    </svg>
  );
}

export function HairIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8.5h16v2.1H4z" fill="currentColor" fillOpacity={0.16} stroke="none" />
      <path d="M4 9.5h16" />
      <path d="M6.5 9.5v6M10 9.5v6M14 9.5v6M17.5 9.5v6" />
    </svg>
  );
}

export function FacialHairIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path
        d="M5 7.5a7 7 0 0 1 14 0v1.5a7 7 0 0 1-14 0z"
        fill="currentColor"
        fillOpacity={0.14}
      />
      <path d="M9 10c1.2.9 4.8.9 6 0" />
      <path d="M8.5 12c.4 3 1.9 5 3.5 5s3.1-2 3.5-5" />
    </svg>
  );
}

export function WardrobeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path
        d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.34 2.23l.58 3.47A1 1 0 0 0 3.83 10H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.17a1 1 0 0 0 .99-.8l.58-3.47a2 2 0 0 0-1.34-2.23z"
        fill="currentColor"
        fillOpacity={0.14}
      />
    </svg>
  );
}

export const CATEGORY_ICONS: Record<CategoryKey, Icon> = {
  skin: SkinIcon,
  hair: HairIcon,
  "facial-hair": FacialHairIcon,
  wardrobe: WardrobeIcon,
};

/* ---- Sidebar nav icons ---- */

function Dashboard(props: SVGProps<SVGSVGElement>) {
  // An actual dashboard layout (rail + two stacked panels), not four dots.
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3.5" width="7" height="17" rx="1.8" />
      <rect x="14" y="3.5" width="7" height="7.5" rx="1.8" />
      <rect x="14" y="13" width="7" height="7.5" rx="1.8" />
    </svg>
  );
}

function Scans(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8V6a2 2 0 0 1 2-2h2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v2" />
      <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="10.5" r="1.9" />
      <path d="M8.6 16c.7-1.6 2-2.6 3.4-2.6s2.7 1 3.4 2.6" />
    </svg>
  );
}

function Routine(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 6.3l1.1 1.1 2-2.1" />
      <path d="M3.5 12.3l1.1 1.1 2-2.1" />
      <path d="M3.5 18.3l1.1 1.1 2-2.1" />
      <path d="M10 6h10M10 12h10M10 18h10" />
    </svg>
  );
}

function Looks(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M11 3l1.7 4.3L17 9l-4.3 1.7L11 15l-1.7-4.3L5 9l4.3-1.7z" />
      <path d="M18 14l.6 1.6 1.6.6-1.6.6L18 19l-.6-1.6-1.6-.6 1.6-.6z" />
    </svg>
  );
}

export const NAV_ICONS: Record<string, Icon> = {
  dashboard: Dashboard,
  scans: Scans,
  routine: Routine,
  "your looks": Looks,
  wardrobe: WardrobeIcon,
};
