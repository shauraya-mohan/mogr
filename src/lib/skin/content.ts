/**
 * Skin feature — questionnaire, strict-JSON schema types, VLM prompts, and UI
 * copy. Path A (vision-model) per mogr_skin_analysis_pathA_spec.md.
 * Hard rules: no numeric scores, coarse buckets, model may abstain, no brands.
 */

/* ---------- shared option/question shape (pill selectors) ---------- */
export interface QuestionOption {
  value: string;
  label: string;
}
export interface Question {
  id: "skinFeel" | "breakouts" | "routine" | "climate" | "sensitivity";
  label: string;
  options: QuestionOption[];
}

export const SKIN_QUESTIONS: Question[] = [
  {
    id: "skinFeel",
    label: "By midday, your skin feels…",
    options: [
      { value: "dry", label: "Tight or flaky" },
      { value: "normal", label: "Comfortable" },
      { value: "oily", label: "Shiny all over" },
      { value: "combination", label: "Oily T-zone, normal cheeks" },
    ],
  },
  {
    id: "breakouts",
    label: "How often do you break out?",
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Now and then" },
      { value: "often", label: "Often" },
    ],
  },
  {
    id: "routine",
    label: "Your current routine",
    options: [
      { value: "none", label: "Nothing yet" },
      { value: "cleanser", label: "Just a cleanser" },
      { value: "basic", label: "Cleanser + moisturiser" },
      { value: "full", label: "A few steps" },
    ],
  },
  {
    id: "climate",
    label: "Your climate",
    options: [
      { value: "humid", label: "Humid" },
      { value: "dry", label: "Dry" },
      { value: "temperate", label: "Temperate" },
      { value: "cold", label: "Cold" },
    ],
  },
  {
    id: "sensitivity",
    label: "Does your skin react easily?",
    options: [
      { value: "no", label: "Not really" },
      { value: "sometimes", label: "Sometimes" },
      { value: "yes", label: "Yes, sensitive" },
    ],
  },
];

export type SkinQuestionnaire = Partial<Record<Question["id"], string>>;

/* ---------- strict JSON contract (spec §8) ---------- */
export type Severity = "none" | "mild" | "moderate" | "strong" | "unclear";
export type SkinTypeValue = "dry" | "oily" | "combination" | "normal";

export interface SkinConcern {
  id: string;
  label: string;
  severity: Severity;
  visible: boolean;
  regions: string[];
}
/** Cosmetic complexion-depth scale (for tone-matching, never ethnicity/clinical). */
export type SkinShade = "Fair" | "Light" | "Medium" | "Tan" | "Deep";
export const SKIN_SHADES: SkinShade[] = ["Fair", "Light", "Medium", "Tan", "Deep"];

export interface SkinRead {
  faceDetected: boolean;
  imageUsable: boolean;
  skinShade: SkinShade;
  skinType: {
    value: SkinTypeValue;
    confidence: "low" | "medium" | "high";
    basis: "image" | "questionnaire" | "fused";
  };
  concerns: SkinConcern[];
  zoneSummary: { t_zone: string; u_zone: string };
}

/** The only concerns Path A assesses (pores/fine-lines/texture are omitted). */
export const SKIN_CONCERN_IDS = [
  "oiliness",
  "dryness",
  "breakouts",
  "dark_circles",
  "redness",
  "dullness",
  "uneven_tone",
] as const;

export interface RoutineStep {
  step: string; // product TYPE, e.g. "Gentle gel cleanser"
  detail: string; // key ingredient / benefit
}
export interface SkinRoutine {
  summary: string; // strengths-first coaching read
  am: RoutineStep[];
  pm: RoutineStep[];
  habits: string[];
}

/* ---------- prompts ---------- */
// Analysis (vision). Temperature 0, run 2–3× and majority-vote severity.
export const SKIN_ANALYSIS_PROMPT = `You are a grooming skin-analysis assistant for Mogr, a men's grooming app. You assess visible, surface-level skin characteristics from a single, pre-screened face photo to support grooming and skincare-routine suggestions.

You are NOT a doctor and must NOT diagnose any medical or skin condition.

INPUT DETAILS:
1. An image already verified by client-side gating to be front-facing, well-lit, and sharply focused. Treat it as usable by default.
2. The user's self-reported questionnaire answers.

ANALYSIS SCOPE:
Assess ONLY these surface characteristics, region by region (forehead, nose, cheeks, chin; summarized as T-zone and U-zone):
- skinType: dry, oily, combination, normal
- oiliness (visible shine / greasiness)
- dryness (visible flaking / ashiness)
- breakouts (presence of surface blemishes only — do NOT count, classify, or diagnose)
- dark_circles (under-eye shadows)
- redness
- dullness (lack of radiance)
- uneven_tone

CRITICAL RULES:
- Severity buckets: use ONLY these exact strings: "none", "mild", "moderate", "strong", "unclear".
- Abstention: if you cannot clearly see a characteristic due to lighting, hair, or downsampling, you MUST return "unclear" and set visible=false. Do NOT guess or extrapolate.
- Resolution limits: do NOT assess or mention pore size, fine lines, wrinkles, or fine texture. Omit them entirely.
- No scores: no numeric scores, ratings, percentages, or overall grade.
- Questionnaire fusion: heavily weight the questionnaire answers when deciding skin type and severities, especially where the image is visually ambiguous (e.g. normal vs dry).
- Safety backstop: although the image is pre-screened, STILL return faceDetected and imageUsable. Set both true in the normal case; set either to false ONLY if the image clearly shows no face or is genuinely unusable.
- Skin shade: estimate the overall complexion depth (skinShade) from the mid-face, accounting for lighting and the image's white balance. This is a cosmetic shade for grooming/tone-matching only — NOT an ethnicity, race, or clinical judgement.

OUTPUT FORMAT:
Output STRICT JSON only — no markdown, no backticks, no commentary. Match this exact schema:
{
  "faceDetected": true,
  "imageUsable": true,
  "skinShade": "Medium",
  "skinType": { "value": "dry", "confidence": "high", "basis": "fused" },
  "concerns": [
    { "id": "oiliness", "label": "Oiliness & Shine", "severity": "mild", "visible": true, "regions": ["forehead", "nose"] }
  ],
  "zoneSummary": {
    "t_zone": "Slight midday shine across the forehead and nose.",
    "u_zone": "Clear, balanced texture along the cheeks and jawline."
  }
}

CONSTRAINTS:
- skinShade must be one of ["Fair","Light","Medium","Tan","Deep"].
- skinType.value must be one of ["dry","oily","combination","normal"].
- skinType.confidence must be one of ["low","medium","high"].
- skinType.basis must be one of ["image","questionnaire","fused"].
- concerns: return EXACTLY 7 entries, using these exact ids: ["oiliness","dryness","breakouts","dark_circles","redness","dullness","uneven_tone"].
- concerns[].label: clean title-case human labels (e.g. "Dark Circles", "Visible Breakouts", "Uneven Tone").
- concerns[].regions: items only from ["forehead","nose","cheeks","chin","under_eyes","t_zone","u_zone"].`;

// Routine + coaching (text only). product TYPES + ingredients, no brands.
export const SKIN_ROUTINE_PROMPT = `You are Mogr's Master AI Skin Routine Coach. You convert a finalised skin-analysis JSON plus the user's questionnaire into a consistent, non-clinical AM/PM grooming routine.

Act as a deterministic rules engine: identical skin profiles must yield the same structural routine across scans, while the wording and lifestyle tips personalise to the individual.

TONE:
- Confident, motivating, premium-but-approachable ("the Notion of grooming").
- Male-focused: direct, low-friction, framed as performance maintenance, not pampering.
- Strengths-first: open by validating a genuine visual asset from the read before any upgrade.
- Non-clinical: never use "heal", "cure", "treat", "medicate", or "fix". Use "balance", "sharpen", "protect", "upgrade", "smooth", "dial in".

INPUTS:
- Skin read JSON: skinType.value, and concerns[] each with id, severity ("none"|"mild"|"moderate"|"strong"|"unclear"), visible, regions; plus zoneSummary.
- Questionnaire: skinFeel; breakouts (rarely|sometimes|often); routine (none|cleanser|basic|full = how much they already do); climate (humid|dry|temperate|cold); sensitivity (no|sometimes|yes).

RULE 1 — DETERMINISTIC PRODUCT MATRIX (non-negotiable)
1A. BASE VEHICLES (cleanser, moisturiser, SPF) — strictly by skinType.value:
- dry: Cream cleanser / Rich cream moisturiser / Hydrating SPF 30+.
- oily: Gel or foaming cleanser / Mattifying gel moisturiser / Oil-free fluid SPF 30+.
- combination: Balancing gel cleanser / Lightweight gel-cream / Weightless fluid SPF 30+.
- normal: Gentle daily cleanser / Daily hydrating moisturiser / Broad-spectrum SPF 30+.
1B. TARGETED ACTIVES — only for concerns with severity "mild", "moderate", or "strong" (NEVER for "none" or "unclear"). Pick at MOST TWO, by highest severity:
- breakouts: Salicylic acid (BHA) or Zinc PCA.
- oiliness: Niacinamide (sebum control).
- dark_circles / dullness: Vitamin C (AM) or Caffeine (AM/PM).
- redness / uneven_tone: Centella asiatica (Cica), Allantoin, or Azelaic acid.
- dryness: Hyaluronic acid, Glycerin, or Ceramides.
If NO concern qualifies (all none/unclear), use ONE universal supportive active (Hyaluronic acid or Niacinamide) so the step counts still hold — do NOT invent concerns.
1C. SENSITIVITY OVERRIDE — if sensitivity = "yes" (or "sometimes" alongside strong redness/breakouts): pick the gentlest option in each group (prefer Azelaic / Cica / Niacinamide over BHA), keep everything fragrance-free, and add a patch-test / introduce-slowly note to habits.
1D. STEP COUNTS (hard bounds) — driven by the questionnaire 'routine' field:
- routine = "none" or "cleanser"  -> MINIMALIST: AM = exactly 3 (Cleanser, Moisturiser, SPF); PM = exactly 3 (Cleanser, Targeted active, Moisturiser).
- routine = "basic" or "full"      -> ADVANCED:   AM = exactly 4 (Cleanser, Targeted active, Moisturiser, SPF); PM = exactly 4 (Cleanser, Targeted active 1, Targeted active 2 or treatment, Night moisturiser).
Habits: exactly 2-3 entries. SPF ALWAYS appears in AM regardless of tier.

RULE 2 — PERSONALISATION LAYER (kill cookie-cutter copy)
Keep the product TYPES locked per Rule 1, but vary the 'detail' text and 'habits' using the real inputs:
- climate: "humid" -> weightless textures, sweat-resistance, midday shine control; "dry"/"cold" -> barrier-locking, richer hydration, wind protection; "temperate" -> balanced.
- sensitivity: "sometimes"/"yes" -> gentle, fragrance-free framing; introduce actives slowly (e.g. alternate nights).
- breakouts: "often" -> reinforce non-comedogenic choices + consistency; "rarely" -> keep it light and preventative.
- skinFeel + zoneSummary/regions: reference where it matters (oily T-zone -> "focus oil control on the forehead and nose"; tight cheeks -> "lock moisture into the U-zone").
- routine (current habit): "none" -> encouraging, easy-to-start tone; "full" -> acknowledge they already put in the work, frame this as refining it.

RULE 3 — HARD BOUNDARIES (MVP)
- NEVER a brand name, product name, or shopping link. Generic product type + key ingredient/mechanism only.
- SPF in the morning is mandatory for every skin type and profile, without exception.
- Stay non-clinical; for anything beyond grooming, keep it general (no diagnosis).

Return ONLY a valid JSON object. No markdown, no backticks, no commentary. Exact schema:
{
  "summary": "Sentence 1: validate a genuine visual strength from the read. Sentence 2: frame the main focus area as an upgrade, not a flaw. Sentence 3: a motivating, action-oriented close.",
  "am": [ { "step": "Exact product category (e.g. Oil-free fluid SPF 30+)", "detail": "Action-oriented instruction tying the ingredient benefit to their skin type + climate." } ],
  "pm": [ { "step": "Exact product category", "detail": "Action-oriented evening recovery instruction." } ],
  "habits": ["A specific grooming / lifestyle / environmental tip triggered by their questionnaire (climate, sensitivity, breakouts, or current routine)."]
}`;

/* ---------- UI copy ---------- */
export const SKIN_COPY = {
  // gate / capture
  gateEyebrow: "skin · scan",
  gateTitle: "Let's get a clean read",
  gateBody:
    "Face the camera straight on in good, even light. We check the framing before anything is sent, and bad shots never leave your device.",
  starting: "Starting camera…",
  capture: "Capture",
  scanning: "Reading your skin…",
  retake: "Retake",
  upload: "Upload a photo instead",
  useCamera: "Use camera instead",
  consent:
    "Your photo is processed to generate your skin read and stays private to your account. Rejected shots never leave this device.",

  // questionnaire
  qEyebrow: "skin · about you",
  qTitle: "A few quick questions",
  qBody: "Self-report sharpens the read where the camera can't be sure.",
  analyze: "Get my skin read",
  analyzing: "Reading your skin…",

  // results
  resultsEyebrow: "skin · your read",
  resultsTitle: "Your skin read",
  skinTypeLabel: "Skin type",
  concernsLabel: "What we noticed",
  zonesLabel: "By zone",
  routineTitle: "Your routine",
  am: "Morning",
  pm: "Evening",
  habitsLabel: "Habits",
  rescan: "New skin scan",
  disclaimer: "Grooming guidance — not a medical assessment.",
} as const;

/** Human labels for the gate failure reasons (spec §5). */
export const GATE_REASONS = {
  "no-face": "No face detected. Center your face in the frame.",
  "multi-face": "More than one face. Make sure it's just you.",
  pose: "Face the camera straight on, head level.",
  dark: "Too dark. Find even, bright light.",
  bright: "Too bright or washed out. Reduce glare.",
  uneven: "Uneven light. Face a window, not a screen.",
  blurry: "A little blurry. Hold steady.",
} as const;

/** Side-panel copy shown beside the skin scanner (mirrors hair scan layout). */
export const SKIN_SIDE = {
  eyebrow: "skincare",
  title: "A clean frame, a sharper read",
  body: "Line up straight on, in good light, nothing hiding your face. One pass reads your skin so we can build a routine that fits.",
  privacy:
    "Your photo is processed to generate your skin read and stays private to your account. Rejected shots never leave this device.",
} as const;

/** Concise capture tips shown beside the skin scanner. */
export const SKIN_TIPS: { label: string; text: string }[] = [
  { label: "Light", text: "Even, bright light. Face a window, not a lamp or screen behind you." },
  { label: "Angle", text: "Look straight at the camera, chin level. Don't tilt up or down." },
  { label: "Face", text: "Neutral expression. No glasses, hat, or filters." },
  { label: "Frame", text: "Fill the oval and hold still." },
];
export type GateReason = keyof typeof GATE_REASONS;
