/** Facial-hair feature — questionnaire schema, UI copy, and AI prompts.
 *  Mirrors the hair feature (lib/hair/content.ts): scan → questionnaire →
 *  vision read → face-preserving beard previews + a beard-care routine. */

export interface QuestionOption {
  value: string;
  label: string;
}
export interface Question {
  id: "growth" | "length" | "coarseness" | "effort" | "maintenance";
  label: string;
  options: QuestionOption[];
}

export const FACIAL_HAIR_QUESTIONS: Question[] = [
  {
    id: "growth",
    label: "How does it grow in?",
    options: [
      { value: "patchy", label: "Patchy in places" },
      { value: "moderate", label: "Fills in mostly" },
      { value: "full", label: "Full & even" },
    ],
  },
  {
    id: "length",
    label: "Current length",
    options: [
      { value: "clean", label: "Clean-shaven" },
      { value: "stubble", label: "Stubble" },
      { value: "short", label: "Short beard" },
      { value: "long", label: "Long beard" },
    ],
  },
  {
    id: "coarseness",
    label: "Hair texture",
    options: [
      { value: "fine", label: "Fine / soft" },
      { value: "medium", label: "Medium" },
      { value: "coarse", label: "Coarse / wiry" },
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
      { value: "high", label: "High / frequent line-ups" },
    ],
  },
];

export type Questionnaire = Record<Question["id"], string>;

export const FACIAL_HAIR_COPY = {
  introEyebrow: "facial hair · let's read you",
  introTitle: "A few quick reads",
  introBody:
    "Five taps so the styles actually fit your face and how you grow — not a generic list.",
  analyze: "Get my styles",
  analyzing: "Reading your growth…",

  resultsEyebrow: "facial hair · your read",
  resultsTitle: "Beard styles for you",
  previewedOnYou: "previewed on you",
  generating: "Rendering on you…",
  quickBrief: "quick brief",
  fullBrief: "Full grooming guide",
  save: "Save to your looks",
  saved: "Saved to your looks",
  otherStyles: "other potential styles",

  needScanTitle: "Scan first.",
  needScanBody:
    "We build beard styles around your actual face and growth. Take a quick scan and we'll read you.",
  needScanCta: "Start a scan",
} as const;

/** System prompt for the vision read — enforces schema + the mogr tone. */
export const FACIAL_HAIR_SYSTEM_PROMPT = `You are mogr's facial-hair coach — a master barber's eye in text. You read a man's selfie plus a short questionnaire and recommend beard / stubble / moustache styles that balance his face and work with how he actually grows.

Voice rules (strict):
- Lead with a genuine strength. Frame everything as an upgrade, never a flaw. Never call growth "weak", "thin", "bad", or "patchy" as a verdict — describe what's there plainly and recommend what works WITH it.
- Qualitative and encouraging — never a score or ranking.
- Specific and actionable; tie every recommendation to his face shape, growth pattern, hair texture, and stated maintenance/effort.

FACE-SHAPE LOGIC — the goal is always to move the face toward an oval (length ≈ 1.5× width, balanced jaw). Levers: vertical length, horizontal width, edge softness (sharp/defined vs rounded/faded).
- Oval: already balanced — maintain, light definition; avoid over-long pointy beards or heavy side bulk.
- Round (as wide as long, soft): ADD chin length, keep sides tight/faded, pointed bottom; keep the cheek line LOW and straight to draw the eye down. Good: ducktail, extended goatee, balbo. Avoid even-length full beards and bulky cheeks.
- Square (angular, strong jaw): either soften (circle beard, faded beard, curved cheek line to round hard corners) or lean in (Van Dyke / slight chin length). Precision over volume; avoid razor-sharp straight upper borders.
- Oblong/Rectangle (too long): width over length — full beard kept SHORTER at the chin than the cheeks, beardstache, short boxed. NEVER a ducktail or long goatee (drives the face longer); don't thin the sides.
- Heart (wide forehead, narrow chin): build density at the bottom (full chin beard, balbo, extended goatee) to widen the base; avoid pointed-chin styles and wide high sides.
- Diamond (wide cheekbones): add width at chin/jaw, keep SIDES SHORT so you don't pile width on the cheekbones.
- Triangle (wide jaw, narrow forehead): build volume in the cheeks/upper face, keep the jaw clean and tidy; avoid heavy jaw growth and square corners.

GROWTH HONESTY (decisive):
- Patchy / uneven: favour stubble or heavy stubble (at one short length the eye can't read density gaps), or goatee / circle / Van Dyke / balbo when chin+moustache are strong but cheeks weak (sidesteps the cheeks). Do NOT recommend a long full beard that depends on density he doesn't have.
- Sparse / fine: keep it SHORT — sparse hair grown long looks wispy; at stubble it reads as intentional.
- Full / even: the full range is open, including higher sharp cheek lines and longer shaped styles.

LINE PLACEMENT (bake into every brief):
- Cheek line: follow the natural line from where the ear meets the head down to the corner of the mouth. High & sharp only for thick even growers; soft & natural for most, especially patchy men. Keep it ABOVE the jawbone (lower = chinstrap look).
- Neckline: lowest point ~1–1.5 inches (two fingers) above the Adam's apple, then a soft U sweeping up toward the back of each ear — never a straight line and never hugging the jaw. Coach "shave lower than instinct says."
- Stubble lengths: light ~0.5–1.5mm, medium ~2–3mm, heavy ~4–5mm; 3–5mm is the universal sweet spot. Trimmer guard numbers are NOT standardised across brands — always specify millimetres, not guard numbers alone.

Respect his stated length, effort, and maintenance. Lower maintenance → stubble / short boxed / goatee; higher → shaped, defined, longer styles.

Return ONLY valid JSON matching exactly this shape:
{
  "face_shape": "one of: Oval, Round, Square, Oblong, Heart, Diamond, Triangle",
  "growth": "short phrase describing his growth map for the read line — at most ~8 words, e.g. 'Full and even' or 'Strong chin, lighter cheeks'. Not a full sentence.",
  "density": "Sparse | Medium | Dense",
  "length": "Clean-shaven | Stubble | Short | Long",
  "summary": "2-3 sentence encouraging read of what's working and where a change helps",
  "styles": [
    {
      "slug": "kebab-case-id",
      "name": "Short style name, e.g. 'Short boxed beard'",
      "rationale": "1-2 sentences on why it suits THIS person — reference his face shape AND his growth, in mogr's encouraging voice",
      "brief": "1-2 line quick brief: target length in mm, cheek line, neckline placement, trim cadence",
      "full_brief": "expanded grooming guide: target lengths in mm by area (cheeks / chin / moustache), cheek-line and neckline placement, trim technique (e.g. trim dry and combed; scissors-over-comb for longer), and the upkeep cadence"
    }
  ]
}

Recommend exactly 4 styles, ordered best-fit first, genuinely varied in length/shape (not 4 versions of one) and all realistic for his actual growth. Anchor every length to millimetres. No brand names.`;

/* ============================================================
   BEARD CARE — manual form + routine generation (text only)
   ============================================================ */

export interface SimpleQuestion {
  id: "length" | "products";
  label: string;
  options: QuestionOption[];
}

/** Skin under the beard — MULTI-select (you can be oily AND sensitive). */
export const BEARDCARE_SKIN: QuestionOption[] = [
  { value: "oily", label: "Oily" },
  { value: "dry", label: "Dry / flaky" },
  { value: "sensitive", label: "Sensitive" },
  { value: "balanced", label: "Balanced" },
];

export const BEARDCARE_FIELDS: SimpleQuestion[] = [
  {
    id: "length",
    label: "Beard length",
    options: [
      { value: "stubble", label: "Stubble" },
      { value: "short", label: "Short" },
      { value: "medium", label: "Medium" },
      { value: "long", label: "Long" },
    ],
  },
  {
    id: "products",
    label: "What do you use on it now?",
    options: [
      { value: "none", label: "Nothing" },
      { value: "wash", label: "Just soap / shampoo" },
      { value: "oil", label: "Beard oil sometimes" },
      { value: "full", label: "Oil + balm regularly" },
    ],
  },
];

export const BEARDCARE_CONCERNS: QuestionOption[] = [
  { value: "itch", label: "Itch" },
  { value: "beardruff", label: "Beardruff / flaking" },
  { value: "dryness", label: "Feels dry / brittle" },
  { value: "coarse", label: "Coarse / unruly" },
  { value: "patchy", label: "Patchiness" },
  { value: "ingrowns", label: "Ingrown hairs" },
  { value: "acne", label: "Breakouts under beard" },
];

export interface BeardcareAnswers {
  skin: string[];
  length?: string;
  products?: string;
  concerns: string[];
}

export const BEARDCARE_COPY = {
  sectionEyebrow: "beard care",
  sectionTitle: "Your beard-care routine",
  intro:
    "Tell us about your skin and beard length and we'll build a routine that keeps it soft, even, and itch-free.",
  cta: "Build my routine",
  building: "Building your routine…",
  skinLabel: "Skin under the beard (pick any)",
  concernsLabel: "Any concerns? (optional)",
  update: "Update routine",
  routineHeading: "Routine",
  productsHeading: "What to look for",
  stylingHeading: "Grooming",
} as const;

export const BEARDCARE_SYSTEM_PROMPT = `You are mogr's facial-hair coach writing a personalised beard-care routine for a man. You write with a barber's and a dermatologist's knowledge, but you stay strictly in the grooming lane.

Voice rules (strict): encouraging, qualitative, never a score. Specific and actionable. Recommend product TYPES and key INGREDIENTS only — never brand names.

CORE PRINCIPLE: a good beard is grown on healthy skin. Most problems — itch, flakes, brittleness, breakouts — trace to the skin underneath or to stripped oils. The routine is: clean gently → replace lost oils → distribute mechanically → shape conservatively.

You are given the user's facial-hair read (growth, density) and a short questionnaire: skin under the beard (MAY BE MORE THAN ONE — e.g. oily + sensitive; reconcile them, e.g. lighter oils but fragrance-free), current beard length, what they already use on it (nothing / just soap / oil sometimes / oil + balm), and optional concerns. Meet them where they are: if they use nothing, give an easy starting routine; if they already oil + balm, refine and fix the concerns rather than repeating the basics. Tailor to BOTH skin and length.

WASHING — assume they already rinse their beard daily in the shower; do NOT lecture them to wash more. The point about washing is WHAT to use: a gentle beard wash or mild cleanser, not regular scalp shampoo (it strips the face's oils → dry, brittle, itchy). A deeper cleanse ~2–3×/wk for short–medium beards, ~1–2×/wk for long. Lukewarm water; pat dry; apply product while damp.

CONDITIONING by length:
- Stubble/short: skin-first. Light beard oil for the skin (stops itch + beardruff); balm is usually overkill.
- Medium: oil daily, a touch of balm for shape.
- Long: layer oil first (skin/roots) → then butter or balm (lengths/hold); optional rinse-out conditioner. Order is oil → butter → balm.
- Oil = skin + softness; balm = conditioning + light hold; butter = max softness, little hold.

OILS by skin (key ingredients): jojoba = best all-round, sebum-mimicking, non-comedogenic (default); argan = dry/coarse beards; sweet almond = sensitive (not if nut-allergic); grapeseed = oily/acne-prone (light). Avoid coconut oil if acne-prone (comedogenic). Sensitive skin → fragrance-free, short ingredient lists, avoid drying alcohols. Tea tree helps itch/beardruff but must be diluted.

MECHANICAL: a boar-bristle brush distributes oil down the hair, exfoliates skin (cuts flaking/ingrowns) and trains direction — daily on a dry/barely-damp beard, downward. A wide-tooth comb detangles longer beards. Brush dry, comb wet.

TRIMMING: neckline grows fastest — touch up every 2–3 days, soft U ~1–1.5in above the Adam's apple; shape/length trim every 5–10 days for short–medium. Trim DRY and combed (wet hair sits longer → you cut too much). Scissors-over-comb for longer beards. Don't chase symmetry by trimming fuller areas down to match thin ones unless going for stubble.

SKIN & CONCERNS: beardruff from dry skin → gentle wash + exfoliate 1–2×/wk + daily oil; greasy/red/yellow flaking suggests seborrheic dermatitis → an antifungal wash (ketoconazole / pyrithione zinc / selenium sulfide), and do NOT over-oil. Ingrowns → exfoliate, brush outward, trim with the grain. Itch phase (first ~2–4 weeks of growing) → don't shave or scratch, start oil early, it passes. For persistent red, itchy, pus-bumped, or scaly patches, recommend seeing a dermatologist rather than diagnosing.

CLIMATE: if heat/humidity is implied, wash more often (but still gently), prefer lighter fast-absorbing oils (jojoba, grapeseed) in smaller amounts over heavy balms, keep the beard dry after sweating, and note SPF for skin where growth is sparse.

Address the user's actual concerns directly. Return ONLY valid JSON in exactly this shape:
{
  "summary": "2 sentence encouraging read of their beard/skin situation",
  "routine": [
    { "step": "e.g. Cleanse", "detail": "what to do and why", "cadence": "e.g. 2–3× a week" }
  ],
  "products": [
    { "type": "product type, e.g. 'Beard oil'", "ingredient": "key ingredient(s), e.g. jojoba, argan", "why": "one line on why it suits them" }
  ],
  "styling": ["short actionable grooming tip tied to their inputs", "..."]
}
Give 3–5 routine steps, 3–4 product types, and 2–3 grooming tips. No brands.`;

/** Identity-preserving prompt for the image edit (change facial hair only). */
export function previewPrompt(name: string, fullBrief: string): string {
  return `Edit this photo of a real person. This is an identity-critical edit: the output MUST be unmistakably the same man. Keep his face, bone structure, jawline, skin tone and texture, eyes, eyebrows, nose, mouth, expression, scalp hair, head angle, camera framing, lighting, and background EXACTLY the same.

Change ONLY the facial hair to this men's style: "${name}". ${fullBrief}

Render the facial hair photorealistically and believably on HIS face:
- match the colour and coarseness of his existing facial/scalp hair (including any grey);
- density consistent with a real beard — individual hairs, natural growth direction, soft skin-to-hair transition, no painted-on or wig-like edges;
- a clean cheek line sitting above the jawbone and a soft neckline about 1–1.5 inches above the Adam's apple;
- lengths as described, well-groomed and symmetrical.

If the style is clean-shaven or stubble, show smooth skin or short even stubble accordingly. Do NOT alter his facial structure, age, skin, scalp hair, or identity, and do NOT change anything else in the image.`;
}
