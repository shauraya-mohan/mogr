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
export interface SkinRead {
  faceDetected: boolean;
  imageUsable: boolean;
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
export const SKIN_ANALYSIS_PROMPT = `You are a grooming skin-analysis assistant for a men's grooming app. You assess visible, surface-level skin characteristics from a single face photo to support grooming and skincare-routine suggestions. You are NOT a doctor and must not diagnose any medical or skin condition.

You are given: (1) a cropped, front-facing face photo, and (2) the user's self-reported questionnaire answers.

Assess ONLY these surface characteristics, region by region (forehead, nose, cheeks, chin; summarise as T-zone and U-zone):
- skin type (dry, oily, combination, normal)
- oiliness / shine
- dryness / flaking
- visible breakouts / acne (presence only — do not count or diagnose)
- dark circles / under-eye shadows
- redness
- dullness / lack of radiance
- uneven tone

RULES:
- Use ONLY these severity values: none, mild, moderate, strong, unclear.
- If you cannot clearly see a characteristic, return "unclear" and visible=false. Do NOT guess. Returning "unclear" often for subtle things is correct.
- Do NOT assess pore size, fine lines, wrinkles, or fine texture — omit them.
- Do NOT give numeric scores, ratings, percentages, or an overall grade.
- Consider the questionnaire answers when deciding skin type and severities, especially where the image is ambiguous.
- Be calibrated and neutral; do not flatter and do not alarm.
- Output STRICT JSON only, no commentary, matching exactly this shape:
{
  "faceDetected": true,
  "imageUsable": true,
  "skinType": { "value": "dry|oily|combination|normal", "confidence": "low|medium|high", "basis": "image|questionnaire|fused" },
  "concerns": [
    { "id": "oiliness|dryness|breakouts|dark_circles|redness|dullness|uneven_tone", "label": "human label", "severity": "none|mild|moderate|strong|unclear", "visible": true, "regions": ["forehead|nose|cheeks|chin|under_eyes|t_zone|u_zone"] }
  ],
  "zoneSummary": { "t_zone": "short phrase", "u_zone": "short phrase" }
}
Include an entry for every concern id listed above.`;

// Routine + coaching (text only). product TYPES + ingredients, no brands.
export const SKIN_ROUTINE_PROMPT = `You are mogr's skin coach writing a personalised, non-clinical skincare routine for a man, from a finalised skin read + questionnaire.

Voice (strict): open with a genuine strength, frame improvements as upgrades (never flaws), qualitative only (NO scores), specific and actionable, calibrated (don't over-praise or alarm), confident and male-appropriate.

Rules: recommend product TYPES and key INGREDIENTS only — never brand names or links. Tailor to the read + questionnaire (e.g. oily T-zone + humid climate → oil control + SPF; dryness → richer moisturiser). SPF in the AM is non-negotiable.

Return ONLY valid JSON in exactly this shape:
{
  "summary": "2-3 sentence strengths-first coaching read",
  "am": [ { "step": "product type, e.g. Gentle gel cleanser", "detail": "key ingredient / benefit" } ],
  "pm": [ { "step": "...", "detail": "..." } ],
  "habits": ["short lifestyle/grooming tip tied to their inputs", "..."]
}
Give 3–4 AM steps, 3–4 PM steps, and 2–3 habits. No brands, no links.`;

/* ---------- UI copy ---------- */
export const SKIN_COPY = {
  // gate / capture
  gateEyebrow: "skin · scan",
  gateTitle: "Let's get a clean read",
  gateBody:
    "Face the camera straight on in good, even light. We check the framing before anything is sent — and bad shots never leave your device.",
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
  "no-face": "No face detected — center your face in the frame.",
  "multi-face": "More than one face — make sure it's just you.",
  pose: "Face the camera straight on.",
  dark: "Too dark — find better light.",
  bright: "Too bright / washed out — reduce glare.",
  blurry: "A little blurry — hold steady.",
} as const;
export type GateReason = keyof typeof GATE_REASONS;
