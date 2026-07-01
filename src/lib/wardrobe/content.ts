/* ============================================================
   mogr — WARDROBE placeholder content + types
   Ported verbatim from the Claude Design prototype's driver
   scripts (wardrobe-inventory.js / wardrobe-style.js /
   wardrobe-scan.js). This is presentational stand-in data so the
   three wardrobe pages render and interact exactly like the
   design. Every block is marked with a TODO(backend) pointing at
   the endpoint that will replace it (see mogr_wardrobe_backend_plan.md).
   ============================================================ */

export type Category = "top" | "bottom" | "outerwear" | "footwear" | "accessory";

export interface WardrobeItemView {
  name: string;
  cat: Category;
  /** Detected dominant colours, dominant first (hex). */
  colors: string[];
  formality: string;
  fit: string;
}

/* ------------------------------------------------------------
   CLOSET INVENTORY
   TODO(backend): replace with GET /api/wardrobe/items — each item
   is a wardrobe_items row { id, name, category, colors[], formality,
   fit, season, storagePath }. `colors` are the tagger's hex values;
   the card's placeholder tile becomes the Photoroom cutout (signed URL).
   ------------------------------------------------------------ */
export const ITEMS: WardrobeItemView[] = [
  // ---- Tops ----
  { name: "White crew tee", cat: "top", colors: ["#EDEAE0"], formality: "Casual", fit: "Slim" },
  { name: "Ecru oxford shirt", cat: "top", colors: ["#E6DFC9", "#FBFAF6"], formality: "Smart casual", fit: "Straight" },
  { name: "Charcoal henley", cat: "top", colors: ["#34332F"], formality: "Casual", fit: "Slim" },
  { name: "Navy knit polo", cat: "top", colors: ["#27324E"], formality: "Smart casual", fit: "Straight" },
  { name: "Sage linen shirt", cat: "top", colors: ["#9AA588", "#EDEAE0"], formality: "Casual", fit: "Relaxed" },
  { name: "Black pocket tee", cat: "top", colors: ["#1C1C1A"], formality: "Casual", fit: "Slim" },
  { name: "Rust waffle tee", cat: "top", colors: ["#9C5B33"], formality: "Casual", fit: "Slim" },
  // ---- Bottoms ----
  { name: "Indigo straight jeans", cat: "bottom", colors: ["#27324E"], formality: "Casual", fit: "Straight" },
  { name: "Stone chinos", cat: "bottom", colors: ["#A8977A"], formality: "Smart casual", fit: "Straight" },
  { name: "Charcoal trousers", cat: "bottom", colors: ["#34332F"], formality: "Smart casual", fit: "Slim" },
  { name: "Olive cargo pants", cat: "bottom", colors: ["#55552F"], formality: "Casual", fit: "Relaxed" },
  { name: "Off-white denim", cat: "bottom", colors: ["#DAD3C0"], formality: "Casual", fit: "Straight" },
  // ---- Outerwear ----
  { name: "Olive overshirt", cat: "outerwear", colors: ["#6B6B3A", "#EDEAE0"], formality: "Smart casual", fit: "Straight" },
  { name: "Camel wool coat", cat: "outerwear", colors: ["#B08D57"], formality: "Formal", fit: "Straight" },
  { name: "Navy bomber", cat: "outerwear", colors: ["#27324E"], formality: "Casual", fit: "Straight" },
  { name: "Charcoal overcoat", cat: "outerwear", colors: ["#34332F"], formality: "Formal", fit: "Straight" },
  // ---- Footwear ----
  { name: "White leather sneakers", cat: "footwear", colors: ["#EDEAE0"], formality: "Smart casual", fit: "True to size" },
  { name: "Tan suede boots", cat: "footwear", colors: ["#B08D57"], formality: "Smart casual", fit: "True to size" },
  { name: "Black derby shoes", cat: "footwear", colors: ["#1C1C1A"], formality: "Formal", fit: "True to size" },
  { name: "Brown loafers", cat: "footwear", colors: ["#6B4A2E"], formality: "Smart casual", fit: "True to size" },
  // ---- Accessories ----
  { name: "Brown leather belt", cat: "accessory", colors: ["#6B4A2E"], formality: "Smart casual", fit: "Leather" },
  { name: "Tortoise sunglasses", cat: "accessory", colors: ["#4A3626", "#B08D57"], formality: "Casual", fit: "Acetate" },
  { name: "Charcoal beanie", cat: "accessory", colors: ["#34332F"], formality: "Casual", fit: "Wool" },
  { name: "Camel scarf", cat: "accessory", colors: ["#B08D57"], formality: "Smart casual", fit: "Wool" },
];

export const CAT_LABEL: Record<Category, string> = {
  top: "Top",
  bottom: "Bottom",
  outerwear: "Outerwear",
  footwear: "Footwear",
  accessory: "Accessory",
};

/** Filter chips on the inventory page (value → label). */
export const INVENTORY_FILTERS: { value: "all" | Category; label: string }[] = [
  { value: "all", label: "All" },
  { value: "top", label: "Tops" },
  { value: "bottom", label: "Bottoms" },
  { value: "outerwear", label: "Outerwear" },
  { value: "footwear", label: "Footwear" },
  { value: "accessory", label: "Accessories" },
];

/** Plural noun used in the "N pieces · tops" count line. */
export const FILTER_NOUN: Record<string, string> = {
  top: "tops",
  bottom: "bottoms",
  outerwear: "outerwear",
  footwear: "footwear",
  accessory: "accessories",
};

/* ------------------------------------------------------------
   COLOUR PALETTE ("your colours")
   TODO(backend): deterministic — from GET /api/wardrobe/palette,
   derived from skin undertone + hair tone via a rules/lookup table
   (NOT a model call), so a user always sees the same palette.
   ------------------------------------------------------------ */
export interface Swatch {
  hex: string;
  name: string;
}

export const FLATTERING: Swatch[] = [
  { hex: "#6B6B3A", name: "Olive" },
  { hex: "#B08D57", name: "Camel" },
  { hex: "#EDEAE0", name: "Off-white" },
  { hex: "#9C5B33", name: "Rust" },
  { hex: "#38493B", name: "Forest" },
  { hex: "#27324E", name: "Navy" },
];

export const CAUTION: Swatch[] = [
  { hex: "#CFE3EE", name: "Icy blue" },
  { hex: "#B5487F", name: "Cool fuchsia" },
  { hex: "#9AA0A6", name: "Cool grey" },
];

/* ------------------------------------------------------------
   OCCASION CHIPS (style-me input)
   ------------------------------------------------------------ */
export const OCCASIONS = [
  "Casual",
  "Work",
  "Smart casual",
  "Going out",
  "Date",
  "Formal",
  "Athletic",
] as const;

/* ------------------------------------------------------------
   OUTFITS (generated result)
   TODO(backend): from POST /api/wardrobe/analyze (stylist model).
   Each `pieces` entry is an OWNED wardrobe_item (name + dominant hex
   for the cutout); title/rationale/colorLine/fitNote/gap are the
   stylist copy. Server validates every itemId is owned.
   ------------------------------------------------------------ */
export type OutfitSlot = "top" | "bottom" | "footwear" | "layer";

export interface OutfitPiece {
  name: string;
  tint: string;
  slot: OutfitSlot;
}

export interface Outfit {
  title: string;
  occasion: string;
  pieces: OutfitPiece[];
  rationale: string;
  colorLine: string;
  fitNote: string;
  gap: string | null;
}

export const OUTFITS: Outfit[] = [
  {
    title: "Understated date-night",
    occasion: "Date · cooler evening",
    pieces: [
      { name: "Charcoal henley", tint: "#34332F", slot: "top" },
      { name: "Indigo jeans", tint: "#27324E", slot: "bottom" },
      { name: "Tan suede boots", tint: "#B08D57", slot: "footwear" },
      { name: "Olive overshirt", tint: "#6B6B3A", slot: "layer" },
    ],
    rationale:
      "Layered and easy, but considered. The overshirt does the talking so you don't have to — throw it over the henley and leave it open.",
    colorLine: "Earthy olive and off-white lean into your warm undertone.",
    fitNote: "Keep the henley slim and the jeans straight — one clean line, top to bottom.",
    gap: null,
  },
  {
    title: "Easy weekend",
    occasion: "Casual · daytime",
    pieces: [
      { name: "White crew tee", tint: "#EDEAE0", slot: "top" },
      { name: "Stone chinos", tint: "#A8977A", slot: "bottom" },
      { name: "White sneakers", tint: "#EDEAE0", slot: "footwear" },
      { name: "Navy bomber", tint: "#27324E", slot: "layer" },
    ],
    rationale:
      "The uniform that always works. Tonal up top, the bomber adds just enough structure for coffee-to-dinner.",
    colorLine: "Warm neutrals with a navy anchor — quiet, and firmly in your lane.",
    fitNote: "Cuff the chinos once to break over the sneaker.",
    gap: null,
  },
  {
    title: "Sharp for work",
    occasion: "Work · smart",
    pieces: [
      { name: "Ecru oxford", tint: "#E6DFC9", slot: "top" },
      { name: "Charcoal trousers", tint: "#34332F", slot: "bottom" },
      { name: "Black derbies", tint: "#1C1C1A", slot: "footwear" },
      { name: "Camel wool coat", tint: "#B08D57", slot: "layer" },
    ],
    rationale:
      "Grown-up without a suit. The camel coat warms up the charcoal and reads intentional the second you walk in.",
    colorLine: "Camel against charcoal is your highest-payoff pairing — warm over cool, low contrast.",
    fitNote: "Tuck the oxford; let the trousers just kiss the shoe.",
    gap: "A knit tie in muted brown would sharpen this even further.",
  },
];

/** Cycling status lines shown while the stylist "runs". */
export const STYLING_STATUS = [
  "Reading your closet…",
  "Matching your colours…",
  "Putting looks together…",
];

/* ------------------------------------------------------------
   SCAN FLOW
   ------------------------------------------------------------ */

/** Cycling status lines during the cutout + tagging round-trip. */
export const PROCESSING_STATUS = [
  "Removing background…",
  "Cleaning up the garment…",
  "Reading the details…",
];

/* Editable auto-detected tags on the scan result screen.
   TODO(backend): seed from the vision tagger's JSON; PATCH
   /api/wardrobe/items/{id} with any user overrides. */
export type DetectedField =
  | { key: string; type: "text"; value: string; options: string[] }
  | { key: string; type: "colour"; value: string[]; options: string[] };

export const DETECTED: DetectedField[] = [
  { key: "Category", type: "text", value: "Outerwear", options: ["Top", "Bottom", "Outerwear", "Footwear", "Accessory"] },
  { key: "Subtype", type: "text", value: "Overshirt", options: ["Overshirt", "Shirt jacket", "Chore coat", "Shacket", "Light jacket"] },
  { key: "Colours", type: "colour", value: ["#6B6B3A", "#EDEAE0"], options: ["#6B6B3A", "#EDEAE0", "#55552F", "#A8977A", "#34332F", "#B08D57"] },
  { key: "Pattern", type: "text", value: "Solid", options: ["Solid", "Stripe", "Check", "Print", "Texture"] },
  { key: "Formality", type: "text", value: "Smart casual", options: ["Casual", "Smart casual", "Formal"] },
  { key: "Fit", type: "text", value: "Straight", options: ["Slim", "Straight", "Relaxed", "Oversized"] },
  { key: "Season", type: "text", value: "All-season", options: ["Spring", "Summer", "Autumn", "Winter", "All-season"] },
];

export const COLOUR_NAME: Record<string, string> = {
  "#6B6B3A": "Olive",
  "#EDEAE0": "Off-white",
  "#55552F": "Fatigue",
  "#A8977A": "Stone",
  "#34332F": "Charcoal",
  "#B08D57": "Camel",
};

/** e.g. "White crew tee" → "tee" — the placeholder cutout caption. */
export function pieceLabel(name: string): string {
  return name.split(" ").slice(-1)[0].toLowerCase();
}

export function colourLabel(hex: string): string {
  return (COLOUR_NAME[hex] || "Custom") + " · " + hex.toUpperCase();
}
