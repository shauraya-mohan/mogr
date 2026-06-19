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

/** Identity-preserving prompt for the image edit (change hair only). */
export function previewPrompt(name: string, fullBrief: string): string {
  return `Edit this photo of a real person. Keep their face, facial features, skin tone, expression, lighting, and background EXACTLY the same and clearly recognisable as the same person. Change ONLY the hair to this men's hairstyle: "${name}". ${fullBrief} Natural, photorealistic, well-groomed result. Do not alter facial structure, age, or identity.`;
}
