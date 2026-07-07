/**
 * Stage 1 — request interpreter.
 * Converts occasion chips + season + free-text prompt → StylingIntent.
 * The intent drives Stage 2 (soft-scoring filter) and Stage 3 (stylist).
 */
import type { StyleSeason } from "./content";

export interface StylingIntent {
  occasion: string;                 // one of INTENT_OCCASIONS, best-fit
  formalityTargetScore: number;     // 1–10 target for THIS event — a lean, never a gate
  aesthetic: string[];              // themes implied: y2k, streetwear, old-money/preppy, minimal… ([] if none)
  weather: "hot" | "mild" | "cold" | "rain" | "unspecified";
  vibe: string[];                   // free descriptors
  dressCodeNotes: string;           // 1 sentence: what the event actually calls for
  constraints: string[];            // explicit limits only
  mode: "closet_only" | "hybrid";   // from UI, not the model
}

export const INTENT_OCCASIONS = [
  "everyday", "work", "going out", "date",
  "formal event", "active", "lounge", "outdoor",
] as const;

/** Season → weather baseline. The model may override this from prompt text (e.g. "poolside" in winter). */
export const SEASON_WEATHER_BASELINE: Record<StyleSeason, "hot" | "mild" | "cold"> = {
  spring: "mild",
  summer: "hot",
  autumn: "mild",
  winter: "cold",
};

/* ── system prompt ─────────────────────────────────────────────── */
export const INTERPRETER_SYSTEM = `\
ROLE
Convert a men's outfit request into a structured styling intent. You understand real
dress codes, aesthetic subcultures, and how weather changes an outfit. Be decisive.

INPUT
- chips: preset occasion labels (may be empty).
- season: the user's selected season (spring/summer/autumn/winter) — your weather
  baseline (spring/autumn→mild, summer→hot, winter→cold).
- prompt: free text (may be empty), e.g. "frat party, y2k" or "cafe to WFH but I've got meetings, look sharp".

TASK — infer:
- occasion ∈ {${INTENT_OCCASIONS.join(", ")}}.
- formalityTargetScore (1–10): how dressed-up the EVENT is, using this rubric —
  1–2 lounge/athletic · 3–4 casual · 5–6 smart casual · 7–8 business casual/dressy · 9–10 formal.
- aesthetic: any style themes implied (y2k, streetwear, preppy/old-money, minimal, grunge,
  techwear, gorpcore…). [] if none implied.
- weather: hot | mild | cold | rain | unspecified. Start from the season baseline given
  above, and adjust ONLY if the prompt clearly implies otherwise (e.g. "poolside" stays
  hot regardless of season if it reads as a resort/indoor-pool context; "rainy" → rain).
  Don't let a single ambiguous word override a clear season baseline — this is a soft
  hint for the stylist, not a hard rule, so default to the season baseline when unsure.
- vibe: 0–3 free descriptors (understated, playful, sharp…).
- dressCodeNotes: ONE sentence stating what the event actually calls for and any nuance —
  e.g. "Elevated smart-casual: sharp but not stuffy; polos and clean trousers work."
- constraints: explicit limits ONLY ("no shorts", "no bright colours"). Do not invent.
  Do NOT put weather/temperature phrases here — that's the separate "weather" field.

DRESS-CODE INTELLIGENCE (apply this reasoning):
- "poolside / beach (not swimming)" → hot, score ~3–4, expect shorts + short sleeves + relaxed.
- "frat party" / "y2k" / "rave" → casual (3–4), aesthetic tags set, statement/printed pieces welcome — not safe minimal basics.
- "pub / bar for drinks, not exclusive" → smart casual (~5), NOT formal.
- "fancy restaurant / rooftop / formal date" → dressy (~7–8); note in dressCodeNotes that the
  stylist should ELEVATE what the user owns if he lacks true formalwear.
- "cafe / co-working but meetings, look sharp" → smart casual sharp (~6); polos & knit polos are
  ideal; note that sleeveless/graphic/athletic are NOT appropriate.

OUTPUT — strict JSON only, matching the StylingIntent shape (no mode). No prose, no markdown.
{
  "occasion": "date",
  "formalityTargetScore": 6,
  "aesthetic": ["preppy"],
  "weather": "mild",
  "vibe": ["understated", "sharp"],
  "dressCodeNotes": "Smart casual date-night: put-together but not stiff.",
  "constraints": []
}`;
