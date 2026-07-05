/* ============================================================
   mogr — WARDROBE types, taxonomy + (style-page) placeholder data

   The inventory + scan flows are now backed by real data:
   - garment cutout: Photoroom ghost mannequin (see lib/wardrobe/photoroom.ts)
   - tags: OpenAI vision (see lib/wardrobe/tagging.ts)
   - storage: wardrobe_items.data holds the full GarmentTags; category/name/
     image_url(cutout path) are denormalised for filtering + the grid.

   The Style-me outfits + colour palette below are STILL placeholder — they
   belong to the recommendation phase (TODO: POST /api/wardrobe/analyze,
   GET /api/wardrobe/palette).
   ============================================================ */

export type Category = "top" | "bottom" | "outerwear" | "footwear" | "accessory";

export interface GarmentColor {
  /** Common colour name, e.g. "Olive", "Off-white", "Charcoal". */
  name: string;
  /** Accurate hex sampled from the fabric. */
  hex: string;
}

/** The rich tag set the vision model returns for one garment. */
export interface GarmentTags {
  isGarment: boolean;
  /** Short natural label, e.g. "Olive overshirt". */
  name: string;
  category: Category | "unclear";
  /** Specific garment type, e.g. "oxford shirt", "chinos", "bomber jacket". */
  subtype: string;
  /** 1–3 dominant colours, dominant first. */
  colors: GarmentColor[];
  pattern: string;
  /** Description of any graphic/logo/text/print, else null. */
  print: string | null;
  /** 1–2 aesthetic/genre tags (streetwear, minimalist, …). */
  style: string[];
  fit: string;
  formality: string;
  /** Fabric look, e.g. "cotton jersey", "denim", "wool". */
  material: string;
  season: string[];
  occasions: string[];
  /** Notable features: hood, full zip, chest pocket, ribbed cuffs, … */
  details: string[];
  /** One short, neutral styling note. No scores. */
  notes: string;
}

/** A wardrobe_items row as read on the client (data holds GarmentTags). */
export interface WardrobeItemRow {
  id: string;
  category: string | null;
  name: string | null;
  color: string | null;
  /** Cutout storage path (signed on read). */
  image_url: string | null;
  data: GarmentTags | null;
  created_at: string;
}

/* ------------------------------------------------------------
   Taxonomy — the allowed values. Shared by the tagging prompt
   (enumerated for the model) and the scan-result editable tags.
   ------------------------------------------------------------ */
export const CATEGORY_OPTIONS: Category[] = [
  "top",
  "bottom",
  "outerwear",
  "footwear",
  "accessory",
];

export const PATTERN_OPTIONS = [
  "solid",
  "striped",
  "checked",
  "plaid",
  "graphic",
  "print",
  "colorblock",
  "camo",
  "floral",
  "textured",
] as const;

export const FIT_OPTIONS = [
  "slim",
  "regular",
  "relaxed",
  "oversized",
  "tailored",
  "skinny",
  "baggy",
] as const;

export const FORMALITY_OPTIONS = [
  "casual",
  "smart casual",
  "business casual",
  "formal",
  "athletic",
] as const;

export const STYLE_OPTIONS = [
  "minimalist",
  "streetwear",
  "classic",
  "smart casual",
  "casual",
  "athleisure",
  "techwear",
  "workwear",
  "preppy",
  "vintage",
  "y2k",
  "gorpcore",
  "grunge",
  "bohemian",
] as const;

export const SEASON_OPTIONS = [
  "spring",
  "summer",
  "autumn",
  "winter",
  "all-season",
] as const;

export const OCCASION_OPTIONS = [
  "everyday",
  "work",
  "going out",
  "date",
  "formal event",
  "active",
  "lounge",
  "outdoor",
] as const;

/** Max garments a single bulk upload accepts. */
export const BULK_LIMIT = 8;

/* ------------------------------------------------------------
   Inventory filter chips
   ------------------------------------------------------------ */
export const INVENTORY_FILTERS: { value: "all" | Category; label: string }[] = [
  { value: "all", label: "All" },
  { value: "top", label: "Tops" },
  { value: "bottom", label: "Bottoms" },
  { value: "outerwear", label: "Outerwear" },
  { value: "footwear", label: "Footwear" },
  { value: "accessory", label: "Accessories" },
];

export const FILTER_NOUN: Record<string, string> = {
  top: "tops",
  bottom: "bottoms",
  outerwear: "outerwear",
  footwear: "footwear",
  accessory: "accessories",
};

/** Cycling status lines during the cutout + tagging round-trip. */
export const PROCESSING_STATUS = [
  "Removing background…",
  "Cleaning up the garment…",
  "Reading the details…",
];

export function colourLabel(c: GarmentColor): string {
  return `${c.name} · ${c.hex.toUpperCase()}`;
}

/* ============================================================
   STYLE-ME placeholder data (recommendation phase — not yet wired)
   TODO(backend): POST /api/wardrobe/analyze (stylist) + GET
   /api/wardrobe/palette (deterministic undertone + hair-tone table).
   ============================================================ */
export const OCCASIONS = [
  "Casual",
  "Work",
  "Smart casual",
  "Going out",
  "Date",
  "Formal",
  "Athletic",
] as const;

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
      "Layered and easy, but considered. The overshirt does the talking so you don't have to. Throw it over the henley and leave it open.",
    colorLine: "Earthy olive and off-white lean into your warm undertone.",
    fitNote: "Keep the henley slim and the jeans straight, one clean line top to bottom.",
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
    colorLine: "Warm neutrals with a navy anchor. Quiet, and firmly in your lane.",
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
    colorLine: "Camel against charcoal is your highest-payoff pairing: warm over cool, low contrast.",
    fitNote: "Tuck the oxford; let the trousers just kiss the shoe.",
    gap: "A knit tie in muted brown would sharpen this even further.",
  },
];

export const STYLING_STATUS = [
  "Reading your closet…",
  "Matching your colours…",
  "Putting looks together…",
];

