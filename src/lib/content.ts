/**
 * Landing page content — extracted so copy/data lives in one typed place
 * and can later be sourced from a CMS or API without touching components.
 */

export const TYPEWRITER_WORDS = [
  "Ascend.",
  "Lock in.",
  "Level up.",
  "Glow up.",
  "Mog.",
] as const;

export interface NavLinkItem {
  label: string;
  href: string;
  /** Hidden on small screens (matches the prototype's .hide-sm). */
  hideOnMobile?: boolean;
}

export const NAV_LINKS: NavLinkItem[] = [
  { label: "log in", href: "/login", hideOnMobile: true },
  { label: "dashboard", href: "/dashboard", hideOnMobile: true },
];

export interface Category {
  index: string;
  /** ALL-CAPS index label shown on the card, e.g. "01 / SKIN". */
  indexLabel: string;
  /** Title-case category label used in the overlay, e.g. "01 / Skin". */
  overlayCat: string;
  label: string;
  description: string;
  /** Placeholder text until a real image is wired in. */
  placeholder: string;
}

export const CATEGORIES: Category[] = [
  {
    index: "01",
    indexLabel: "01 / SKIN",
    overlayCat: "01 / Skin",
    label: "Skin",
    description: "Scan your skin. Get an essential AM/PM routine built for you.",
    placeholder: "image — skin",
  },
  {
    index: "02",
    indexLabel: "02 / HAIR",
    overlayCat: "02 / Hair",
    label: "Hair",
    description: "Find cuts that suit your face — previewed on your actual face.",
    placeholder: "image — hair",
  },
  {
    index: "03",
    indexLabel: "03 / FACIAL HAIR",
    overlayCat: "03 / Facial Hair",
    label: "Facial Hair",
    description: "Beard styles matched to your growth and jawline.",
    placeholder: "image — facial hair",
  },
  {
    index: "04",
    indexLabel: "04 / WARDROBE",
    overlayCat: "04 / Wardrobe",
    label: "Wardrobe",
    description: "Colors and fits that work for your tone and build.",
    placeholder: "image — wardrobe",
  },
];

export interface HowStep {
  num: string;
  tag: string;
  title: string;
  body: string;
}

export const HOW_STEPS: HowStep[] = [
  {
    num: "01",
    tag: "capture",
    title: "Scan once",
    body: "One capture reads your face, skin, hair, beard and the clothes you already own. No setup, no forms.",
  },
  {
    num: "02",
    tag: "read",
    title: "Get your read",
    body: "A calm, honest assessment and a routine built around what you actually have — not a generic checklist.",
  },
  {
    num: "03",
    tag: "level up",
    title: "Watch yourself level up",
    body: "See an AI-rendered preview of the upgraded you, then track the real thing as it catches up week by week.",
  },
];

export interface ProofFrame {
  tag: string;
  heading: string;
  body: string;
  placeholder: string;
  isAfter?: boolean;
}

export const PROOF_FRAMES: ProofFrame[] = [
  {
    tag: "Today",
    heading: "Where you are",
    body: "A clear, kind starting point. No scores, no judgement — just an honest look.",
    placeholder: "image — your scan",
  },
  {
    tag: "Dialed in",
    heading: "Where you're headed",
    body: "An AI preview of the upgraded you, with the small, doable steps that get you there.",
    placeholder: "image — ai preview",
    isAfter: true,
  },
];

export interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Start scan", href: "/scan" },
      { label: "What we read", href: "#categories" },
      { label: "How it works", href: "#how" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Careers", href: "#careers" },
      { label: "Press", href: "#press" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "#privacy" },
      { label: "Terms", href: "#terms" },
      { label: "Your data", href: "#data" },
    ],
  },
];
