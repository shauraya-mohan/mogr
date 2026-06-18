import type { SVGProps } from "react";
import type { CategoryKey } from "@/lib/dashboard/data";

type Icon = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

/* ---- Category icons (dashboard quick cards) ---- */

export function SkinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 2.7l5.7 5.7a8 8 0 1 1-11.4 0z" />
      <path d="M9 14.5a3 3 0 0 0 3 2.5" />
    </svg>
  );
}

export function HairIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 8.5h16" />
      <path d="M6.5 8.5v6M10 8.5v6M14 8.5v6M17.5 8.5v6" />
    </svg>
  );
}

export function FacialHairIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 9.5a7 7 0 0 1 14 0v1.5a7 7 0 0 1-14 0z" />
      <path d="M9 12c1.2.9 4.8.9 6 0" />
      <path d="M8.5 14c.4 3 1.9 5 3.5 5s3.1-2 3.5-5" />
    </svg>
  );
}

export function WardrobeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.34 2.23l.58 3.47A1 1 0 0 0 3.83 10H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.17a1 1 0 0 0 .99-.8l.58-3.47a2 2 0 0 0-1.34-2.23z" />
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
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1.6" />
      <rect x="14" y="3" width="7" height="7" rx="1.6" />
      <rect x="14" y="14" width="7" height="7" rx="1.6" />
      <rect x="3" y="14" width="7" height="7" rx="1.6" />
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

function Progress(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 17l5-5 4 4 8-8" />
      <path d="M17 8h4v4" />
    </svg>
  );
}

export const NAV_ICONS: Record<string, Icon> = {
  dashboard: Dashboard,
  scans: Scans,
  routine: Routine,
  "your looks": Looks,
  wardrobe: WardrobeIcon,
  progress: Progress,
};
