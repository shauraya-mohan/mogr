/**
 * Stage 1 — request interpreter.
 * Converts occasion chips + free-text prompt → StylingIntent.
 * The intent drives Stage 2 (deterministic filter) and Stage 3 (stylist).
 */

export interface StylingIntent {
  occasion:        string;      // one of the OCCASIONS enum below
  formalityTarget: string;      // one of the FORMALITY enum below
  formalityBand:   string[];    // target + sensible neighbours
  season:          string[];    // always includes "all-season"
  vibe:            string[];    // zero or more descriptive tags
  constraints:     string[];    // only explicit user limits
  mode:            "closet_only" | "hybrid";   // from UI, not the model
}

/* ── valid value sets (used for prompt construction + validation) ── */
export const INTENT_OCCASIONS = [
  "everyday", "work", "going out", "date",
  "formal event", "active", "lounge", "outdoor",
] as const;

export const INTENT_FORMALITIES = [
  "casual", "smart casual", "business casual", "formal", "athletic",
] as const;

export const INTENT_SEASONS = [
  "spring", "summer", "autumn", "winter", "all-season",
] as const;

/**
 * Allowed formalityBand for each formalityTarget.
 * Used to validate / correct the model's output in the route.
 */
export const FORMALITY_BAND: Record<string, string[]> = {
  athletic:          ["athletic"],
  casual:            ["casual", "smart casual"],
  "smart casual":    ["casual", "smart casual", "business casual"],
  "business casual": ["smart casual", "business casual", "formal"],
  formal:            ["business casual", "formal"],
};

/* ── system prompt ─────────────────────────────────────────────── */
export const INTERPRETER_SYSTEM = `\
ROLE
You convert a men's outfit request into a structured styling intent for a wardrobe
recommender. Be decisive and reasonable.

INPUT (user message)
- chips: zero or more preset occasion tags selected by the user.
- prompt: free text (may be empty), e.g. "dinner date, cooler evening, keep it understated".

NOTE ON CHIPS: chips use display labels like "Casual", "Smart casual", "Going out",
"Date", "Formal", "Athletic". Map them to the occasion/formality enum values below.
"Casual" → occasion "everyday", "Smart casual" is a formality signal not an occasion
(infer a fitting occasion), "Formal" → "formal event", "Athletic" → "active".

TASK
Infer: occasion, formalityTarget, an adjacent formalityBand, season, vibe, and any
hard constraints. If something isn't stated, infer a sensible default from the
occasion; when unsure, widen the formalityBand rather than guessing narrowly.

RULES
- occasion ∈ {${INTENT_OCCASIONS.join(", ")}}.
- formalityTarget ∈ {${INTENT_FORMALITIES.join(", ")}}.
- formalityBand: the target plus sensible adjacent bands
  (casual↔smart casual↔business casual↔formal are neighbours; athletic stands alone).
  Exclude clearly-wrong bands.
- season ∈ {${INTENT_SEASONS.join(", ")}}; always include "all-season".
- vibe: 0–3 short descriptors implied by the request, e.g. "understated", "layered",
  "relaxed". Leave [] if nothing is implied.
- constraints: capture explicit limits ONLY — e.g. "no bright colours", "no shorts",
  weather like "cooler evening". Do NOT invent constraints.
- Do not add detail the user didn't imply beyond reasonable defaults.

OUTPUT
Strict JSON only — no prose, no markdown — matching this exact shape:
{
  "occasion":        "date",
  "formalityTarget": "smart casual",
  "formalityBand":   ["casual", "smart casual", "business casual"],
  "season":          ["autumn", "all-season"],
  "vibe":            ["understated", "layered"],
  "constraints":     ["cooler weather"]
}`;
