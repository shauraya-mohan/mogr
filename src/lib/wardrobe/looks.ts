/* ============================================================
   mogr — WARDROBE · SAVED LOOKS
   Types + occasion theme data for the saved-looks grid, immersive
   preview, and save/edit modal. Backed by the `saved_looks` table
   (kind='wardrobe') — see lib/wardrobe/looksStore.ts.
   ============================================================ */
import type { OutfitPiece, OutfitSlot, WardrobeItemRow } from "@/lib/wardrobe/content";

export type LookPiece = OutfitPiece;

export interface SavedLook {
  id: string;
  name: string;
  occasion: string;
  rationale?: string;
  pieces: LookPiece[];
}

export interface OccasionTheme {
  label: string;
  accent: string;
  dark: boolean;
  grad: string;
  light: string;
  glow: number;
  motifStrength: number;
  motifInk: string;
  /** Raw inline SVG markup for the scene's background motif. */
  motif: string;
}

const BRONZE = "#B0763B";

export const THEMES: Record<string, OccasionTheme> = {
  everyday: {
    label: "Everyday", accent: "#B79B79", dark: false,
    grad: "radial-gradient(120% 90% at 50% 18%, #F3F0E8, #DED9CC 68%, #CFC9BA)",
    light: "radial-gradient(58% 42% at 50% 20%, rgba(255,255,255,0.6), transparent 70%)",
    glow: 0.24, motifStrength: 0.2, motifInk: "rgba(70,66,56,0.9)",
    motif: '<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">' +
      '<circle cx="500" cy="215" r="104" fill="currentColor" opacity="0.42"/>' +
      '<circle cx="500" cy="215" r="150" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.28"/>' +
      '<path d="M0 452 Q 260 388 520 448 T 1000 436 L1000 600 L0 600Z" fill="currentColor" opacity="0.34"/>' +
      '<path d="M0 512 Q 300 452 640 512 T 1000 500 L1000 600 L0 600Z" fill="currentColor" opacity="0.6"/>' +
    "</svg>",
  },
  work: {
    label: "Work", accent: "#8C93A0", dark: false,
    grad: "radial-gradient(120% 90% at 50% 14%, #EEF0F2, #D6D9DE 66%, #C3C7CE)",
    light: "radial-gradient(56% 40% at 50% 16%, rgba(255,255,255,0.66), transparent 68%)",
    glow: 0.2, motifStrength: 0.17, motifInk: "rgba(58,64,74,0.9)",
    motif: '<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">' +
      '<g fill="currentColor">' +
        '<rect x="70" y="300" width="96" height="300" opacity="0.5"/>' +
        '<rect x="188" y="200" width="78" height="400" opacity="0.62"/>' +
        '<rect x="286" y="360" width="120" height="240" opacity="0.42"/>' +
        '<rect x="426" y="150" width="86" height="450" opacity="0.7"/>' +
        '<rect x="534" y="288" width="104" height="312" opacity="0.5"/>' +
        '<rect x="660" y="234" width="80" height="366" opacity="0.6"/>' +
        '<rect x="760" y="330" width="128" height="270" opacity="0.44"/>' +
        '<rect x="908" y="270" width="66" height="330" opacity="0.56"/>' +
      "</g>" +
      '<g fill="#F3F0E8" opacity="0.5">' +
        '<rect x="446" y="180" width="12" height="16"/><rect x="470" y="180" width="12" height="16"/>' +
        '<rect x="446" y="220" width="12" height="16"/><rect x="470" y="220" width="12" height="16"/>' +
        '<rect x="446" y="260" width="12" height="16"/><rect x="470" y="260" width="12" height="16"/>' +
        '<rect x="206" y="230" width="11" height="15"/><rect x="230" y="230" width="11" height="15"/>' +
        '<rect x="206" y="270" width="11" height="15"/><rect x="230" y="270" width="11" height="15"/>' +
        '<rect x="678" y="264" width="11" height="15"/><rect x="702" y="264" width="11" height="15"/>' +
        '<rect x="678" y="304" width="11" height="15"/><rect x="702" y="304" width="11" height="15"/>' +
      "</g>" +
    "</svg>",
  },
  "going out": {
    label: "Going out", accent: BRONZE, dark: true,
    grad: "radial-gradient(120% 100% at 50% 30%, #26241E, #16150F 70%, #0C0B08)",
    light: "radial-gradient(52% 40% at 50% 26%, rgba(240,214,178,0.14), transparent 72%)",
    glow: 0.6, motifStrength: 0.24, motifInk: "rgba(240,214,178,0.92)",
    motif: '<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">' +
      '<circle cx="806" cy="128" r="52" fill="currentColor" opacity="0.5"/>' +
      '<circle cx="788" cy="116" r="52" fill="#16150F" opacity="0.9"/>' +
      '<g fill="currentColor" opacity="0.5">' +
        '<circle cx="150" cy="150" r="6"/><circle cx="250" cy="90" r="4"/><circle cx="360" cy="180" r="7"/>' +
        '<circle cx="620" cy="120" r="5"/><circle cx="120" cy="320" r="8"/><circle cx="500" cy="230" r="4"/>' +
        '<circle cx="900" cy="300" r="6"/><circle cx="440" cy="80" r="3"/>' +
      "</g>" +
      '<g fill="currentColor" opacity="0.16">' +
        '<rect x="40" y="380" width="90" height="220"/><rect x="150" y="320" width="70" height="280"/>' +
        '<rect x="250" y="410" width="110" height="190"/><rect x="380" y="350" width="80" height="250"/>' +
        '<rect x="500" y="300" width="96" height="300"/><rect x="620" y="390" width="76" height="210"/>' +
        '<rect x="720" y="340" width="120" height="260"/><rect x="860" y="300" width="120" height="300"/>' +
      "</g>" +
    "</svg>",
  },
  date: {
    label: "Date", accent: "#C0864B", dark: true,
    grad: "radial-gradient(110% 100% at 50% 42%, #2C2419, #1B1610 66%, #100C08)",
    light: "radial-gradient(42% 36% at 50% 42%, rgba(244,196,140,0.22), transparent 68%)",
    glow: 0.66, motifStrength: 0.26, motifInk: "rgba(244,196,140,0.92)",
    motif: '<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">' +
      '<line x1="0" y1="470" x2="1000" y2="470" stroke="currentColor" stroke-width="1.5" opacity="0.4"/>' +
      '<circle cx="500" cy="300" r="130" fill="currentColor" opacity="0.14"/>' +
      '<path d="M500 250 C 484 276 486 300 500 316 C 514 300 516 276 500 250 Z" fill="currentColor" opacity="0.85"/>' +
      '<rect x="492" y="316" width="16" height="150" rx="4" fill="currentColor" opacity="0.5"/>' +
      '<g stroke="currentColor" stroke-width="4" fill="none" opacity="0.55">' +
        '<path d="M232 300 a44 30 0 0 0 88 0 Z" fill="currentColor" opacity="0.5" stroke="none"/>' +
        '<path d="M276 330 L276 424 M244 440 L308 440" transform="rotate(-8 276 370)"/>' +
        '<path d="M680 300 a44 30 0 0 0 88 0 Z" fill="currentColor" opacity="0.5" stroke="none"/>' +
        '<path d="M724 330 L724 424 M692 440 L756 440" transform="rotate(8 724 370)"/>' +
      "</g>" +
    "</svg>",
  },
  formal: {
    label: "Formal", accent: "#9A8F7C", dark: true,
    grad: "radial-gradient(90% 100% at 50% 8%, #24231F, #131209 72%, #0A0906)",
    light: "radial-gradient(26% 62% at 50% 2%, rgba(255,252,244,0.3), transparent 60%)",
    glow: 0.32, motifStrength: 0.2, motifInk: "rgba(232,228,216,0.9)",
    motif: '<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">' +
      '<path d="M500 0 L640 600 L360 600 Z" fill="currentColor" opacity="0.12"/>' +
      '<g fill="currentColor" opacity="0.24">' +
        '<rect x="60" y="60" width="70" height="540"/><rect x="46" y="52" width="98" height="16"/><rect x="46" y="590" width="98" height="14"/>' +
        '<rect x="870" y="60" width="70" height="540"/><rect x="856" y="52" width="98" height="16"/><rect x="856" y="590" width="98" height="14"/>' +
      "</g>" +
      '<g stroke="currentColor" stroke-width="2.5" fill="none" opacity="0.6">' +
        '<line x1="500" y1="0" x2="500" y2="70"/>' +
        '<path d="M420 100 Q 500 60 580 100"/>' +
        '<path d="M400 130 Q 500 96 600 130"/>' +
      "</g>" +
      '<g fill="currentColor" opacity="0.7">' +
        '<circle cx="420" cy="104" r="6"/><circle cx="460" cy="120" r="6"/><circle cx="500" cy="126" r="6"/>' +
        '<circle cx="540" cy="120" r="6"/><circle cx="580" cy="104" r="6"/><circle cx="500" cy="80" r="7"/>' +
      "</g>" +
    "</svg>",
  },
  active: {
    label: "Active", accent: "#7FA0A8", dark: false,
    grad: "radial-gradient(120% 90% at 50% 16%, #EDF1F1, #D3DBDC 66%, #BFC9CB)",
    light: "radial-gradient(56% 42% at 50% 16%, rgba(255,255,255,0.7), transparent 68%)",
    glow: 0.22, motifStrength: 0.2, motifInk: "rgba(50,66,72,0.9)",
    motif: '<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">' +
      '<circle cx="500" cy="250" r="80" fill="currentColor" opacity="0.34"/>' +
      '<g stroke="currentColor" fill="none">' +
        '<path d="M-40 600 Q 500 300 1040 600" stroke-width="3" opacity="0.55"/>' +
        '<path d="M-40 600 Q 500 360 1040 600" stroke-width="3" opacity="0.4"/>' +
        '<path d="M-40 600 Q 500 420 1040 600" stroke-width="3" opacity="0.28"/>' +
      "</g>" +
      '<g stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.5">' +
        '<line x1="120" y1="150" x2="320" y2="120"/><line x1="150" y1="185" x2="300" y2="163"/>' +
        '<line x1="700" y1="130" x2="900" y2="105"/><line x1="720" y1="168" x2="880" y2="150"/>' +
      "</g>" +
    "</svg>",
  },
  outdoor: {
    label: "Outdoor", accent: "#8FA07C", dark: false,
    grad: "radial-gradient(120% 95% at 50% 14%, #EEF1E9, #D8DED0 64%, #C6CEBC)",
    light: "radial-gradient(58% 44% at 50% 16%, rgba(255,255,255,0.62), transparent 70%)",
    glow: 0.24, motifStrength: 0.2, motifInk: "rgba(58,70,50,0.9)",
    motif: '<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">' +
      '<circle cx="770" cy="170" r="66" fill="currentColor" opacity="0.34"/>' +
      '<path d="M0 470 L220 300 L360 470 Z" fill="currentColor" opacity="0.4"/>' +
      '<path d="M240 470 L470 250 L700 470 Z" fill="currentColor" opacity="0.55"/>' +
      '<path d="M560 470 L780 320 L1000 470 Z" fill="currentColor" opacity="0.42"/>' +
      '<rect x="0" y="468" width="1000" height="140" fill="currentColor" opacity="0.5"/>' +
      '<g fill="currentColor" opacity="0.7">' +
        '<path d="M120 470 L138 420 L156 470 Z"/><path d="M126 448 L138 400 L150 448 Z"/><rect x="134" y="470" width="8" height="16"/>' +
        '<path d="M872 470 L888 428 L904 470 Z"/><path d="M878 450 L888 410 L898 450 Z"/><rect x="884" y="470" width="8" height="14"/>' +
      "</g>" +
    "</svg>",
  },
};

export function themeFor(occasion?: string): OccasionTheme {
  const key = (occasion ?? "").toLowerCase();
  return THEMES[key] ?? THEMES.everyday;
}

export const SLOT_ORDER: OutfitSlot[] = ["top", "layer", "bottom", "footwear", "accessory"];
export const SLOT_LABEL: Record<OutfitSlot, string> = {
  top: "Top", layer: "Layer", bottom: "Bottom", footwear: "Shoes", accessory: "Accessory",
};
/** Saved-look slots map onto the closet's garment categories for the item picker. */
export const SLOT_TO_CATEGORY: Record<OutfitSlot, string> = {
  top: "top", layer: "outerwear", bottom: "bottom", footwear: "footwear", accessory: "accessory",
};

export interface ClosetPickerItem {
  itemId: string;
  name: string;
  tint: string;
  cutoutUrl: string | null;
}

const CATEGORY_TO_SLOT: Record<string, OutfitSlot> = Object.fromEntries(
  Object.entries(SLOT_TO_CATEGORY).map(([slot, category]) => [category, slot as OutfitSlot])
);

/** Groups the user's closet (from wardrobe/store.ts fetchWardrobe()) by look slot, for the item picker. */
export function groupClosetBySlot(
  items: (WardrobeItemRow & { cutoutUrl: string | null })[]
): Record<OutfitSlot, ClosetPickerItem[]> {
  const bySlot: Record<OutfitSlot, ClosetPickerItem[]> = {
    top: [], layer: [], bottom: [], footwear: [], accessory: [],
  };
  for (const item of items) {
    const slot = item.category ? CATEGORY_TO_SLOT[item.category] : undefined;
    if (!slot) continue;
    bySlot[slot].push({
      itemId: item.id,
      name: item.name ?? item.data?.name ?? "Garment",
      tint: item.data?.colors?.[0]?.hex ?? "#888888",
      cutoutUrl: item.cutoutUrl,
    });
  }
  return bySlot;
}

/** Maps a free-text occasion (from the stylist intent or user input) onto a THEMES key. */
export function normalizeOccasion(raw?: string): string {
  const key = (raw ?? "").trim().toLowerCase();
  // Generated outfits carry descriptive occasion text (e.g. "Date · cooler
  // evening"), not always a bare THEMES key — match on substring.
  const match = Object.keys(THEMES).find((themeKey) => key.includes(themeKey));
  return match ?? "everyday";
}

/* ---- abstract per-theme piece arrangements for the immersive preview ----
   Each returns [cx, cy, w, rot] (centre %, width %, rotation deg) per piece. */
type Placement = [number, number, number, number];
function aCascade(n: number): Placement[] {
  return ({
    1: [[50, 50, 34, -3]],
    2: [[42, 38, 33, -5], [59, 60, 33, 4]],
    3: [[40, 30, 32, -6], [57, 49, 32, 4], [44, 71, 31, -3]],
    4: [[38, 27, 30, -6], [58, 42, 30, 5], [41, 60, 30, -4], [59, 76, 29, 4]],
    5: [[37, 23, 28, -6], [56, 36, 28, 5], [41, 52, 28, -4], [59, 66, 27, 5], [44, 82, 26, -3]],
  } as Record<number, Placement[]>)[Math.min(n, 5)] ?? [];
}
function aColumn(n: number): Placement[] {
  return ({
    1: [[50, 50, 34, 0]],
    2: [[47, 34, 32, -1], [54, 66, 32, 1]],
    3: [[46, 27, 31, -1], [54, 50, 31, 1], [46, 73, 30, -1]],
    4: [[46, 22, 29, -1], [55, 41, 29, 1], [45, 60, 29, -1], [54, 80, 28, 1]],
    5: [[46, 18, 27, -1], [55, 35, 27, 1], [45, 51, 27, -1], [55, 67, 27, 1], [46, 84, 26, -1]],
  } as Record<number, Placement[]>)[Math.min(n, 5)] ?? [];
}
function aDynamic(n: number): Placement[] {
  return ({
    1: [[50, 50, 36, -6]],
    2: [[40, 36, 36, -9], [60, 62, 30, 7]],
    3: [[35, 28, 38, -10], [57, 47, 30, 7], [43, 72, 36, -6]],
    4: [[33, 24, 36, -10], [55, 39, 29, 8], [39, 59, 38, -7], [61, 77, 26, 9]],
    5: [[32, 21, 34, -10], [53, 34, 27, 8], [38, 51, 37, -7], [59, 65, 26, 9], [42, 83, 30, -5]],
  } as Record<number, Placement[]>)[Math.min(n, 5)] ?? [];
}

const ARRANGE: Record<string, { fn: (n: number) => Placement[]; flip: boolean }> = {
  everyday: { fn: aCascade, flip: false },
  work: { fn: aColumn, flip: false },
  "going out": { fn: aCascade, flip: true },
  date: { fn: aColumn, flip: false },
  formal: { fn: aColumn, flip: false },
  active: { fn: aDynamic, flip: true },
  outdoor: { fn: aCascade, flip: false },
};

export function arrangementFor(occasion?: string) {
  return ARRANGE[(occasion ?? "").toLowerCase()] ?? ARRANGE.everyday;
}

/** Places `pieces` (ordered by SLOT_ORDER) for the immersive scene. */
export function placePieces(occasion: string | undefined, pieces: LookPiece[]) {
  const ordered = SLOT_ORDER
    .map((slot) => pieces.find((p) => p.slot === slot))
    .filter((p): p is LookPiece => Boolean(p));
  const arr = arrangementFor(occasion);
  const pos = arr.fn(ordered.length);
  return ordered.map((piece, i) => {
    const [x, y, w, rot] = pos[i] ?? [50, 50, 30, 0];
    return { piece, cx: arr.flip ? 100 - x : x, cy: y, w, rot: arr.flip ? -rot : rot };
  });
}
