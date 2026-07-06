/**
 * Stage 3 — LLM stylist call.
 * Receives the shortlist (~10–20 items) + intent + palette, returns up to 3
 * complete outfit proposals. One cheap chatJSON call at temperature 0.3.
 */

import { chatJSON } from "@/lib/openai";
import type { ScoredItem } from "./filter";
import type { StylingIntent } from "./interpreter";
import type { Palette } from "./palette";

export interface StylistOutfit {
  title: string;
  occasion: string;
  /** IDs from the shortlist — route enriches these into OutfitPiece[] */
  itemIds: string[];
  /** Garments the user doesn't own (hybrid mode only, ≤2). */
  outsideItems: string[];
  rationale: string;
  colorRationale: string;
  fitNote: string;
  /** Core slots (top/bottom/footwear) missing from the shortlist. */
  gaps: string[];
}

interface StylistResponse {
  outfits: StylistOutfit[];
}

function buildSystem(undertone: string | undefined, palette: Palette | null): string {
  const paletteBlock = palette
    ? `undertone: ${undertone ?? palette.undertone}
works for you: ${palette.worksForYou.map(s => s.name).join(", ")}
caution colours: ${palette.caution.map(s => s.name).join(", ")}
contrast: ${palette.contrast} — ${palette.contrastGuidance}
depth: ${palette.depth} — ${palette.depthGuidance}`
    : `undertone: ${undertone ?? "unknown"} — no palette derived yet`;

  return `\
ROLE
You are a men's personal stylist. Build complete, wearable outfits from the wardrobe
shortlist provided. Be direct and coaching — no vague qualifiers, no AI buzzwords.

USER'S COLOUR PROFILE
${paletteBlock}

TASK
Build 1–3 complete outfits from the shortlist using the exact item IDs provided.
Each outfit needs a top + bottom + footwear at minimum. Outerwear (layer) is optional.

RULES
- Use ONLY item IDs that appear in the shortlist.
- mode = "closet_only": outsideItems must be [].
- mode = "hybrid": you may list ≤2 specific garments the user doesn't own in outsideItems
  (short name only, e.g. "ecru linen shirt"). Be concrete, not vague.
- Never repeat the same item across outfits unless the shortlist forces it.
- Respect constraints (e.g. "no joggers" → exclude items with jogger subtype).
- colorRationale: name actual palette colours from the profile; explain why each pairing
  works with this user's undertone and contrast level.
- fitNote: one concrete styling instruction per outfit (e.g. "leave untucked, roll sleeves once").
- gaps: if a core slot (top/bottom/footwear) has zero candidates in the shortlist, name it.
- title: 2–4 words, specific — not "Look 1" or generic labels.

OUTPUT
Strict JSON only — no prose, no markdown:
{ "outfits": [{
  "title": "...",
  "occasion": "...",
  "itemIds": ["uuid-1", "uuid-2"],
  "outsideItems": [],
  "rationale": "...",
  "colorRationale": "...",
  "fitNote": "...",
  "gaps": []
}] }`;
}

export async function callStylist(
  shortlist: ScoredItem[],
  intent: StylingIntent,
  undertone: string | undefined,
  palette: Palette | null,
): Promise<StylistOutfit[]> {
  const items = shortlist.map(i => ({
    id: i.id,
    name: i.name ?? i.data?.name ?? "unnamed",
    category: i.category,
    subtype: i.data?.subtype,
    formality: i.data?.formality,
    colors: i.data?.colors?.map(c => `${c.name} (${c.hex})`).join(", "),
    style: i.data?.style?.join(", "),
    season: i.data?.season?.join(", "),
  }));

  const raw = await chatJSON<StylistResponse>({
    system: buildSystem(undertone, palette),
    user: JSON.stringify({
      intent: {
        occasion: intent.occasion,
        formalityTarget: intent.formalityTarget,
        season: intent.season,
        vibe: intent.vibe,
        constraints: intent.constraints,
        mode: intent.mode,
      },
      shortlist: items,
    }),
  });

  const validIds = new Set(shortlist.map(i => i.id));
  const outfits: StylistOutfit[] = Array.isArray(raw?.outfits) ? raw.outfits : [];

  return outfits
    .slice(0, 3)
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
    .filter(o => o.itemIds.length >= 2);
}
