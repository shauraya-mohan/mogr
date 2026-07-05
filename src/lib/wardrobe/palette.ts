/**
 * Deterministic colour palette engine — no LLM, no randomness.
 * derivePalette(undertone, skinShade, hairTone) always returns the identical
 * palette for the same inputs. Based on seasonal colour theory across three
 * axes: undertone (hue), depth (skin shade), contrast (skin vs hair).
 */

export type Undertone = "warm" | "cool" | "neutral";
export type SkinShade = "Fair" | "Light" | "Medium" | "Tan" | "Deep";
export type HairBucket = "dark" | "mid" | "light";
export type Depth = "light" | "mid" | "deep";
export type Contrast = "high" | "medium" | "low";

export interface Swatch {
  name: string;
  hex: string;
}

export interface Palette {
  descriptor: string;
  undertone: Undertone;
  depth: Depth;
  contrast: Contrast;
  worksForYou: Swatch[];      // exactly 6, always spans light→deep
  caution: Swatch[];           // exactly 3
  neutrals: Swatch[];
  contrastGuidance: string;
  depthGuidance: string;
  source: string;
  generatedAt: string;
}

/* ── internal pool type ─────────────────────────────────────── */
interface PaletteEntry extends Swatch {
  depth: Depth;
  signature?: boolean;
}

/* ── rules table ────────────────────────────────────────────── */
const RULES: Record<Undertone, { worksForYou: PaletteEntry[]; caution: Swatch[] }> = {
  warm: {
    worksForYou: [
      { name: "cream",        hex: "#EDEAE0", depth: "light", signature: true },
      { name: "camel",        hex: "#B08D57", depth: "mid",   signature: true },
      { name: "olive",        hex: "#6B6B3A", depth: "mid",   signature: true },
      { name: "terracotta",   hex: "#B87A50", depth: "light" },
      { name: "brick red",    hex: "#8B3A2F", depth: "mid"   },
      { name: "mustard",      hex: "#C99A2E", depth: "mid"   },
      { name: "rust",         hex: "#9C5B33", depth: "mid"   },
      { name: "forest green", hex: "#38493B", depth: "deep"  },
      { name: "chocolate",    hex: "#5A4632", depth: "deep"  },
      { name: "deep teal",    hex: "#245245", depth: "deep"  },
    ],
    caution: [
      { name: "icy blue",     hex: "#CFE3EE" },
      { name: "cool fuchsia", hex: "#B5487F" },
      { name: "cool grey",    hex: "#9AA0A6" },
    ],
  },
  cool: {
    worksForYou: [
      { name: "true white",  hex: "#F4F5F7", depth: "light", signature: true },
      { name: "emerald",     hex: "#1F5E4A", depth: "deep",  signature: true },
      { name: "berry",       hex: "#8E2F52", depth: "mid",   signature: true },
      { name: "ice blue",    hex: "#B8CBDD", depth: "light" },
      { name: "cool blue",   hex: "#2E4A7A", depth: "mid"   },
      { name: "slate",       hex: "#5A6B7A", depth: "mid"   },
      { name: "raspberry",   hex: "#A83A5B", depth: "mid"   },
      { name: "burgundy",    hex: "#5B1E2D", depth: "deep"  },
      { name: "plum",        hex: "#4A2E52", depth: "deep"  },
      { name: "pine",        hex: "#20423C", depth: "deep"  },
    ],
    caution: [
      { name: "orange",     hex: "#C9652E" },
      { name: "mustard",    hex: "#C99A2E" },
      { name: "warm camel", hex: "#C9A878" },
    ],
  },
  neutral: {
    worksForYou: [
      { name: "off-white",      hex: "#F0EEE8", depth: "light", signature: true },
      { name: "soft teal",      hex: "#2E6E6A", depth: "mid",   signature: true },
      { name: "muted burgundy", hex: "#6E3542", depth: "deep",  signature: true },
      { name: "taupe",          hex: "#9C8E7A", depth: "light" },
      { name: "dusty blue",     hex: "#6E8494", depth: "mid"   },
      { name: "soft olive",     hex: "#77794E", depth: "mid"   },
      { name: "jade",           hex: "#4A7A5E", depth: "mid"   },
      { name: "clay",           hex: "#A5654E", depth: "mid"   },
      { name: "slate blue",     hex: "#4A5A72", depth: "deep"  },
      { name: "deep forest",    hex: "#2C4034", depth: "deep"  },
    ],
    caution: [
      { name: "neon green",      hex: "#39FF14" },
      { name: "hot pink",        hex: "#FF69B4" },
      { name: "electric orange", hex: "#FF5E00" },
    ],
  },
};

const UNIVERSAL_NEUTRALS: Swatch[] = [
  { name: "charcoal", hex: "#3A3A36" },
  { name: "navy",     hex: "#27324E" },
  { name: "off-white",hex: "#F4F2EC" },
  { name: "grey",     hex: "#8A8A88" },
  { name: "denim",    hex: "#4A6480" },
  { name: "black",    hex: "#1B1B19" },
];

/* ── axis derivation ────────────────────────────────────────── */
function bucketHair(hairTone: string): HairBucket {
  const t = hairTone.toLowerCase();
  if (t === "unclear") return "mid";
  if (t.includes("black") || (t.includes("dark") && t.includes("brown"))) return "dark";
  if (
    t.includes("light brown") || t.includes("blonde") || t.includes("auburn") ||
    t.includes("grey") || t.includes("gray") || t.includes("white") || t.includes("platinum")
  ) return "light";
  // "brown", "medium brown", etc.
  return "mid";
}

function deriveDepth(shade: SkinShade): Depth {
  if (shade === "Fair" || shade === "Light") return "light";
  if (shade === "Medium" || shade === "Tan") return "mid";
  return "deep";
}

function deriveContrast(skinDepth: Depth, hair: HairBucket): Contrast {
  if (skinDepth === "light") {
    if (hair === "dark") return "high";
    if (hair === "mid")  return "medium";
    return "low";
  }
  if (skinDepth === "mid") {
    if (hair === "dark") return "medium";
    return "low";   // mid+mid, mid+light
  }
  // deep
  if (hair === "light") return "high";
  if (hair === "dark")  return "low";
  return "medium";  // deep+mid
}

/* ── selection logic ────────────────────────────────────────── */
const ADJACENT: Record<Depth, Depth[]> = {
  light: ["mid"],
  mid:   ["light", "deep"],
  deep:  ["mid"],
};

function depthScore(d: Depth, prefer: Depth): number {
  if (d === prefer) return 0;
  if (ADJACENT[prefer].includes(d)) return 1;
  return 2;
}

function selectWorksForYou(pool: PaletteEntry[], preferDepth: Depth): Swatch[] {
  const signatures = pool.filter(e => e.signature);
  const nonSigs    = pool.filter(e => !e.signature);

  // Guarantee: at least one light and one deep in the final 6
  const mandatory: PaletteEntry[] = [];
  if (!signatures.some(e => e.depth === "light")) {
    const pick = nonSigs.find(e => e.depth === "light");
    if (pick) mandatory.push(pick);
  }
  if (!signatures.some(e => e.depth === "deep")) {
    const pick = nonSigs.find(e => e.depth === "deep");
    if (pick) mandatory.push(pick);
  }

  const used = new Set([...signatures, ...mandatory].map(e => e.hex));
  const remaining = nonSigs
    .filter(e => !used.has(e.hex))
    .sort((a, b) => depthScore(a.depth, preferDepth) - depthScore(b.depth, preferDepth));

  const slotsLeft = 6 - signatures.length - mandatory.length;
  const fillers = remaining.slice(0, slotsLeft);

  return [...signatures, ...mandatory, ...fillers].map(({ name, hex }) => ({ name, hex }));
}

function orderNeutrals(undertone: Undertone, contrast: Contrast, depth: Depth): Swatch[] {
  const demoteBlack = undertone === "warm" || (contrast === "low" && depth === "light");
  if (!demoteBlack) return UNIVERSAL_NEUTRALS;
  return [
    ...UNIVERSAL_NEUTRALS.filter(s => s.name !== "black"),
    UNIVERSAL_NEUTRALS.find(s => s.name === "black")!,
  ];
}

/* ── guidance strings ───────────────────────────────────────── */
const CONTRAST_GUIDANCE: Record<Contrast, string> = {
  high:   "Can carry strong light-and-dark pairings — crisp whites against navy or black.",
  medium: "Handles moderate contrast; both tonal and lightly contrasted looks work.",
  low:    "Keep tones close and blended; avoid stark black-and-white near the face — go tonal.",
};

const DEPTH_GUIDANCE: Record<Depth, string> = {
  light: "Softer, lighter colours flatter most near the face.",
  mid:   "Flexible across mid-depth colours.",
  deep:  "Wears rich, deep, saturated colours well.",
};

/* ── public API ─────────────────────────────────────────────── */
export function derivePalette(
  undertone: Undertone,
  skinShade: SkinShade,
  hairTone: string,
  generatedAt: string,
): Palette {
  const hairBucket = bucketHair(hairTone);
  const depth      = deriveDepth(skinShade);
  const contrast   = deriveContrast(depth, hairBucket);

  const warmthWord  = { warm: "Warm", cool: "Cool", neutral: "Versatile" }[undertone];
  const textureWord = { warm: "earthy", cool: "crisp", neutral: "muted" }[undertone];

  return {
    descriptor:      `${warmthWord}, ${textureWord}, ${contrast}-contrast`,
    undertone,
    depth,
    contrast,
    worksForYou:     selectWorksForYou(RULES[undertone].worksForYou, depth),
    caution:         RULES[undertone].caution,
    neutrals:        orderNeutrals(undertone, contrast, depth),
    contrastGuidance: CONTRAST_GUIDANCE[contrast],
    depthGuidance:    DEPTH_GUIDANCE[depth],
    source:          "quiz+scan",
    generatedAt,
  };
}
