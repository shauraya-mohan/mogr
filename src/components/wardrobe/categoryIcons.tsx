import type { SVGProps } from "react";

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

function AllIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
    </svg>
  );
}

function TopIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M8.2 3.5 4.4 6.9l2 2.3L8 8v11.5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V8l1.6 1.2 2-2.3L15.8 3.5a3.8 3.8 0 0 1-7.6 0Z" />
    </svg>
  );
}

function BottomIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M6 3.5h12v2.6l-1.3 14.4h-3.4L12 10l-1.3 10.5H7.3L6 6.1z" />
      <path d="M6 6.1h12" />
    </svg>
  );
}

function OuterwearIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M8 3.5 4 5.6V20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5.6L16 3.5l-4 3-4-3z" />
      <path d="M9.6 3.5 12 6.5l2.4-3" />
      <path d="M12 6.7V21" />
    </svg>
  );
}

function FootwearIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <path d="M3 16.5h11l4 .8c1.3.2 2 .9 2 2v.9a.8.8 0 0 1-.8.8H4a1 1 0 0 1-1-1z" />
      <path d="M3 16.5V13l4-1 2 2 3-1 2 2.6" />
    </svg>
  );
}

function AccessoryIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...p}>
      <circle cx="6.6" cy="13.6" r="3.3" />
      <circle cx="17.4" cy="13.6" r="3.3" />
      <path d="M9.9 12.9h4.2" />
      <path d="M3.3 11.6 4.7 8.6h2.1" />
      <path d="M20.7 11.6 19.3 8.6h-2.1" />
    </svg>
  );
}

export const FILTER_ICONS: Record<string, Icon> = {
  all: AllIcon,
  top: TopIcon,
  bottom: BottomIcon,
  outerwear: OuterwearIcon,
  footwear: FootwearIcon,
  accessory: AccessoryIcon,
};
