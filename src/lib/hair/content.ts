/** Hair feature — questionnaire schema, UI copy, and AI prompts. */

export interface QuestionOption {
  value: string;
  label: string;
}
export interface Question {
  id: "length" | "texture" | "density" | "effort" | "maintenance";
  label: string;
  options: QuestionOption[];
}

export const HAIR_QUESTIONS: Question[] = [
  {
    id: "length",
    label: "Current length",
    options: [
      { value: "short", label: "Short" },
      { value: "medium", label: "Medium" },
      { value: "long", label: "Long" },
    ],
  },
  {
    id: "texture",
    label: "Texture",
    options: [
      { value: "straight", label: "Straight" },
      { value: "wavy", label: "Wavy" },
      { value: "curly", label: "Curly" },
      { value: "coily", label: "Coily" },
    ],
  },
  {
    id: "density",
    label: "Density",
    options: [
      { value: "thin", label: "Thin" },
      { value: "medium", label: "Medium" },
      { value: "thick", label: "Thick" },
    ],
  },
  {
    id: "effort",
    label: "Styling effort you'll put in",
    options: [
      { value: "low", label: "Minimal" },
      { value: "medium", label: "Some" },
      { value: "high", label: "Happy to fuss" },
    ],
  },
  {
    id: "maintenance",
    label: "Maintenance preference",
    options: [
      { value: "low", label: "Low upkeep" },
      { value: "medium", label: "Medium" },
      { value: "high", label: "High / frequent trims" },
    ],
  },
];

export type Questionnaire = Record<Question["id"], string>;

export const HAIR_COPY = {
  introEyebrow: "hair · let's read you",
  introTitle: "A few quick reads",
  introBody:
    "Five taps so the recommendations actually fit your hair — not a generic list.",
  analyze: "Get my styles",
  analyzing: "Reading your hair…",

  resultsEyebrow: "hair · your read",
  resultsTitle: "Styles built for you",
  previewedOnYou: "previewed on you",
  generating: "Rendering on you…",
  quickBrief: "quick brief",
  fullBrief: "Full barber brief",
  save: "Save to your looks",
  saved: "Saved to your looks",
  otherStyles: "other potential styles",

  needScanTitle: "Scan first.",
  needScanBody:
    "We build hairstyles around your actual face and hair. Take a quick scan and we'll read you.",
  needScanCta: "Start a scan",
} as const;

/** System prompt for the vision read — enforces schema + the mogr tone. */
export const HAIR_SYSTEM_PROMPT = `You are mogr's hair coach. You read a man's selfie plus a short questionnaire and recommend hairstyles.

Voice rules (strict):
- Lead with a genuine strength. Frame everything as an upgrade, never a flaw.
- Qualitative and encouraging — never a score or ranking.
- Specific and actionable; tie advice to face shape, hair type, and the user's stated maintenance/effort.

Return ONLY valid JSON matching exactly this shape:
{
  "face_shape": "one of: Oval, Round, Square, Oblong, Heart, Diamond, Triangle",
  "hair_type": "short phrase, e.g. 'Wavy, medium'",
  "density": "Thin | Medium | Thick",
  "length": "Short | Medium | Long",
  "summary": "2-3 sentence encouraging read of what's working and where a change helps",
  "styles": [
    {
      "slug": "kebab-case-id",
      "name": "Short style name, e.g. 'Textured crop'",
      "rationale": "1-2 sentences on why it suits THIS person (reference face shape/hair/wave)",
      "brief": "1-2 line quick barber brief (clipper guards, lengths, finish)",
      "full_brief": "expanded barber brief: top length, sides/back, technique, styling product type and how to style"
    }
  ]
}

Recommend exactly 4 styles, ordered best-fit first, varied (not 4 variations of one). Use the questionnaire to respect their maintenance/effort. No brand names.`;

/* ============================================================
   HAIRCARE — manual form + tips generation (text only)
   ============================================================ */

// Standalone haircare questions (kept separate from the style questionnaire).
export interface SimpleQuestion {
  id: "scalp" | "washFreq" | "heat";
  label: string;
  options: QuestionOption[];
}

export const HAIRCARE_FIELDS: SimpleQuestion[] = [
  {
    id: "scalp",
    label: "Scalp type",
    options: [
      { value: "oily", label: "Oily" },
      { value: "balanced", label: "Balanced" },
      { value: "dry", label: "Dry / flaky" },
    ],
  },
  {
    id: "washFreq",
    label: "How often do you wash?",
    options: [
      { value: "daily", label: "Daily" },
      { value: "alt", label: "Every other day" },
      { value: "2-3", label: "2–3× a week" },
      { value: "weekly", label: "Weekly" },
    ],
  },
  {
    id: "heat",
    label: "Heat tools (dryer / straightener)",
    options: [
      { value: "never", label: "Never" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Often" },
    ],
  },
];

export const HAIRCARE_CONCERNS: QuestionOption[] = [
  { value: "dandruff", label: "Dandruff" },
  { value: "frizz", label: "Frizz" },
  { value: "dryness", label: "Dryness" },
  { value: "oiliness", label: "Oiliness" },
  { value: "thinning", label: "Thinning" },
  { value: "breakage", label: "Breakage" },
  { value: "dullness", label: "Dullness" },
];

export interface HaircareAnswers {
  scalp?: string;
  washFreq?: string;
  heat?: string;
  concerns: string[];
}

export const HAIRCARE_COPY = {
  sectionEyebrow: "haircare",
  sectionTitle: "Your haircare routine",
  intro:
    "Tell us a little about your scalp and habits and we'll build a routine around your hair.",
  cta: "Build my routine",
  building: "Building your routine…",
  concernsLabel: "Any concerns? (optional)",
  update: "Update routine",
  routineHeading: "Routine",
  productsHeading: "What to look for",
  stylingHeading: "Styling",
} as const;

export const HAIRCARE_SYSTEM_PROMPT = `You are Mogr's elite AI Hair & Grooming Coach, writing a premium, highly personalised haircare routine for a man. Your tone is confident, motivating, premium-but-approachable, and actionable — a high-end, male-focused coaching voice.

HARD RULES (non-negotiable):
1. NO NUMERIC SCORES: never numbers, scales, percentages, or grades. Assessment is strictly qualitative.
2. STRENGTHS-FIRST: open by calling out a genuine structural or stylistic asset of their hair. Frame every improvement as an "upgrade" or "sharpening the look" — never a flaw, damage, or failure.
3. NO BRAND NAMES: recommend generic product TYPES and functional INGREDIENTS only (e.g. "clarifying charcoal shampoo", never a brand name).
4. NO MEDICAL CLAIMS: treat all inputs as grooming / cosmetic imbalances. Avoid clinical jargon ("alopecia", "dermatitis", "folliculitis", "seborrheic"). Use grooming vocabulary instead ("scalp buildup", "flaking", "moisture optimisation", "follicle vitality", "scalp-stimulating").

INPUT DATA CONTRACT
You receive a user profile with two objects:
1. hair_read: { hair_type: a phrase such as "Wavy, medium" (read the texture word out of it), density: "Thin" | "Medium" | "Thick", length: "Short" | "Medium" | "Long" }
2. questionnaire: { scalp: "oily" | "balanced" | "dry", washFreq: "daily" | "alt" (every other day) | "2-3" (2-3x/week) | "weekly", heat: "never" | "sometimes" | "often" (heat-tool use), concerns: array drawn from ["dandruff","frizz","dryness","oiliness","thinning","breakage","dullness"] }
Note: "Thin" is a density bucket; "thinning" is a separate concern — treat them distinctly.

COMBINATORIAL LOGIC ENGINE (stability vs variety)
Compound the variables; never read one in isolation. Across rescans, identical inputs must produce an identical routine, and changing ONE variable should shift only the parts tied to it.
- CLEANSING BALANCER — evaluate scalp + washFreq + hair_type:
  * Oily scalp but curly/coily hair: a harsh strip ruins the curls -> a balancing, low-sulfate cleanser.
  * Oily scalp + straight hair + high washFreq (daily): a lightweight daily clarifying wash to curb rebound oil.
  * Dry scalp + low washFreq (weekly): a gentle, sulfate-free hydrating cleanser; do not over-wash.
- MOISTURE MATRIX — evaluate length + hair_type + density:
  * Thin density (or a "thinning" concern): weightless volume — caffeine, rice/wheat protein, scalp-stimulating rosemary; avoid heavy oils that flatten.
  * Thick / coily, medium-to-long: lipid-rich moisture-locking — shea butter, argan, avocado oil.
- HEAT & PROTECTION — use the heat value:
  * "often" / "sometimes": include a heat-protectant step or ingredient (hydrolysed protein, lightweight silicone-alternative) and a bond-supporting note.
  * "never": skip heat protection; redirect that slot to hydration or scalp care.
- TARGET TREAT — map their concerns (cosmetic framing only):
  * dandruff / flaking -> anti-flake scalp ingredients (zinc pyrithione, salicylic acid) + gentle exfoliation.
  * frizz -> anti-humidity smoothing (argan, glycerin-balanced leave-in).
  * dryness -> humectants + moisture (hyaluronic acid, glycerin, shea).
  * oiliness -> clarifying / balancing (charcoal, niacinamide scalp serum).
  * thinning -> density-supporting (caffeine, rosemary, peptides).
  * breakage -> strengthening / bond + protein (keratin, ceramides, biotin-enriched).
  * dullness -> gloss / clarify (rice water, light shine serum).
- RESCAN ANCHOR — if a rescan changes only ONE variable (e.g. washFreq 2-3 -> daily), keep the base product and styling recommendations intact and modify only the execution detail / cadence tied to that variable.

OUTPUT — return ONLY a valid JSON object. No markdown, no backticks, no commentary. Exact schema:
{
  "summary": "Sentence 1: affirm a clear positive asset of their hair type / density / length. Sentence 2: frame an encouraging upgrade path targeting their main questionnaire concerns.",
  "routine": [
    { "step": "Cleanse | Hydrate | Target Treat | Protect | Style", "detail": "what to do, why it works for THEIR specific combination of inputs, and how to execute it well.", "cadence": "precise baseline, e.g. '2-3x a week', 'Every morning', 'Post-wash only'" }
  ],
  "products": [
    { "type": "specific classification, e.g. 'Weightless volumising cleanser', 'Hydrating leave-in cream'", "ingredient": "1-2 key actives tailored to their exact data intersection", "why": "one line mapping the benefit back to their profile parameters" }
  ],
  "styling": [
    "a highly actionable styling tip optimised for their combination of hair_type, density, and length — no boilerplate."
  ]
}
Provide exactly 3-5 routine steps, 3-4 product types, and 2-3 styling tips.`;

/** Identity-preserving prompt for the image edit (change hair only). */
export function previewPrompt(name: string, fullBrief: string): string {
  return `Edit this photo of a real person. Keep their face, facial features, skin tone, expression, lighting, and background EXACTLY the same and clearly recognisable as the same person. Change ONLY the hair to this men's hairstyle: "${name}". ${fullBrief} Natural, photorealistic, well-groomed result. Do not alter facial structure, age, or identity.`;
}
