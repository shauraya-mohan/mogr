/**
 * Stage 3 — LLM stylist call.
 * Receives the wide candidate set + intent, returns up to 3 complete outfit
 * proposals, best match first. One chatJSON call (model has no custom-temperature
 * support — see lib/openai.ts — so we don't pass one).
 */

import { chatJSON } from "@/lib/openai";
import type { ScoredItem } from "./filter";
import type { StylingIntent } from "./interpreter";

export interface StylistOutfit {
  title: string;
  occasion: string;
  /** IDs from the candidate set — route enriches these into OutfitPiece[] */
  itemIds: string[];
  /** Garments the user doesn't own (hybrid mode only, ≤2). */
  outsideItems: string[];
  rationale: string;
  colorRationale: string;
  fitNote: string;
  /** Core slots (top/bottom/footwear) missing from the candidate set. */
  gaps: string[];
}

interface StylistResponse {
  outfits: StylistOutfit[];
}

const SYSTEM = `\
════════ ROLE ════════
You are a men's personal stylist. Build complete, wearable outfits from the wardrobe provided,
nailing the occasion, the vibe, and the weather. Talk like a sharp stylist hyping a mate —
direct, concrete, no buzzwords, no scores.

════════ INPUTS (JSON) ════════
- intent: { occasion, formalityTargetScore (1-10), aesthetic[], weather, vibe[],
            dressCodeNotes, constraints[], mode }
- candidates: the user's garments (ranked best-first), each with:
    { id, name, category, subtype, colors[{name,hex}], formalityScore, style[],
      weatherCompatibility[], sleeveLength, layeringZone, fit, requiresTuck, clashColors[] }
- avoidOutfits: arrays of itemIds already shown (produce DIFFERENT combinations); may be empty.

════════ WHAT TO PRODUCE ════════
Up to THREE complete outfits, ORDERED BEST FIRST (strongest match to the request first).
Always try to reach three; return fewer only if genuinely impossible.
Items MAY be reused across outfits — staples (jeans, white sneakers) recurring is normal and good.
Each outfit needs at least top + bottom + footwear; add a mid/outer layer when weather/occasion
wants it, and an accessory when it lifts the look.

════════ READ THE OCCASION FIRST ════════
Use intent.dressCodeNotes, occasion, aesthetic, weather, and formalityTargetScore as your brief.
- Treat formalityTargetScore as a LEAN, not a filter. If the user's wardrobe lacks true
  formalwear for a dressy event, ELEVATE what he owns — a dark knit polo + tailored trousers +
  clean derbies is a great "formal date" answer. Never refuse to dress him well with what's there.
- Match the aesthetic: a "y2k / frat" request wants playful, era-right, sometimes printed/statement
  pieces and sneakers with attitude — not safe minimal tonal combos. An "old-money/preppy" request
  wants clean, classic pairings.
- Respect weather: hot → short sleeves / shorts / breathable; cold/rain → layers / outerwear.
  Weather is a lean too — don't sacrifice occasion fit chasing a marginal weather match.

════════ APPROPRIATENESS GUARDRAILS (hard) ════════
- NEVER put sleeveless, athletic, or loud-graphic pieces into a work, business, or formal look.
- NEVER overdress a casual context (no dress shirt + dress shoes for a chill pub or cafe).
- Swim/beach shorts and tanks are for hot/poolside/casual only.
- Keep every piece within a sensible band of the target formality — no blazer with gym shorts.

════════ HOW TO BUILD A GOOD OUTFIT ════════
- COMPLETENESS + coherent LAYERING (use layeringZone: base under mid under outer).
- COLOUR HARMONY BETWEEN THE PIECES: tonal, neutral-base-plus-accent, or considered contrast.
  Use each piece's clashColors to AVOID clashing pairings. Reason ONLY about how the garments
  look together — never about the user's skin tone or a personal colour palette.
- FIT & PROPORTION: balance silhouettes; use requiresTuck to decide tuck/untuck and say so in fitNote.
- VARIETY: the three outfits should feel meaningfully different from each other and from avoidOutfits
  — different lead pieces or silhouette, not just a swapped accessory.

════════ MODE ════════
- closet_only: use only candidate items. If a core slot is missing, still return the best look and
  name the gap in "gaps" as plain advice (no products/brands/links).
- hybrid: may add ≤2 described items the user doesn't own, GAP-FILL ONLY (accessories first, then
  bottoms/footwear if it truly levels up the look). Short generic names in "outsideItems".

════════ TONE ════════
- rationale: 1-2 sentences on why the look works for THIS occasion.
- colorRationale: 1 sentence on why the PIECES' colours work together (inter-garment only).
- fitNote: 1 concrete styling instruction (tuck/untuck, roll sleeves, break over the shoe…).
- No scores, no ratings, no harsh judgements.

════════ OUTPUT — strict JSON only ════════
{ "outfits": [ {
  "title": "…",
  "occasion": "…",
  "itemIds": ["…"],
  "outsideItems": [],
  "rationale": "…",
  "colorRationale": "…",
  "fitNote": "…",
  "gaps": []
} ] }`;

function candidatePayload(i: ScoredItem) {
  return {
    id: i.id,
    name: i.name ?? i.data?.name ?? "unnamed",
    category: i.category,
    subtype: i.data?.subtype,
    colors: i.data?.colors?.map(c => `${c.name} (${c.hex})`).join(", "),
    formalityScore: i.data?.formalityScore,
    style: i.data?.style,
    weatherCompatibility: i.data?.weatherCompatibility,
    sleeveLength: i.data?.sleeveLength,
    layeringZone: i.data?.layeringZone,
    fit: i.data?.fit,
    requiresTuck: i.data?.requiresTuck,
    clashColors: i.data?.clashColors,
  };
}

/** Sorted, joined itemIds — used to detect an exact-repeat combination. */
const signature = (ids: string[]) => [...ids].sort().join("|");

export async function callStylist(
  candidates: ScoredItem[],
  intent: StylingIntent,
  avoidOutfits: string[][],
): Promise<StylistOutfit[]> {
  const raw = await chatJSON<StylistResponse>({
    system: SYSTEM,
    user: JSON.stringify({
      intent: {
        occasion: intent.occasion,
        formalityTargetScore: intent.formalityTargetScore,
        aesthetic: intent.aesthetic,
        weather: intent.weather,
        vibe: intent.vibe,
        dressCodeNotes: intent.dressCodeNotes,
        constraints: intent.constraints,
        mode: intent.mode,
      },
      candidates: candidates.map(candidatePayload),
      avoidOutfits,
    }),
  });

  const validIds = new Set(candidates.map(i => i.id));
  const outfits: StylistOutfit[] = Array.isArray(raw?.outfits) ? raw.outfits : [];
  const avoidSignatures = new Set(avoidOutfits.map(signature));

  return outfits
    .map(o => ({
      title: String(o.title ?? ""),
      occasion: String(o.occasion ?? intent.occasion),
      itemIds: (Array.isArray(o.itemIds) ? o.itemIds : []).filter(
        (id: unknown) => typeof id === "string" && validIds.has(id),
      ),
      outsideItems:
        intent.mode === "closet_only"
          ? []
          : (Array.isArray(o.outsideItems) ? o.outsideItems : [])
              .slice(0, 2)
              .map(String),
      rationale: String(o.rationale ?? ""),
      colorRationale: String(o.colorRationale ?? ""),
      fitNote: String(o.fitNote ?? ""),
      gaps: (Array.isArray(o.gaps) ? o.gaps : []).map(String),
    }))
    .filter(o => o.itemIds.length >= 2)
    // Code-level guardrail: even if the model ignores avoidOutfits, never resurface
    // an exact-identical combination on try-again.
    .filter(o => !avoidSignatures.has(signature(o.itemIds)))
    .slice(0, 3);
}
