/**
 * Stage 2 — deterministic candidate selection. No AI, no randomness.
 * Scores every garment against the intent (soft signals, never gates) and
 * returns a wide, best-first candidate set for the stylist to reason over.
 */

import type { WardrobeItemRow, GarmentTags, Category } from "./content";
import type { StylingIntent } from "./interpreter";

/* ── types ──────────────────────────────────────────────────── */
export interface ScoredItem extends WardrobeItemRow {
  _score: number;
}

export interface FilterResult {
  /** Wide, best-first candidate set the stylist will reason over. */
  shortlist: ScoredItem[];
  /** Core slots (top/bottom/footwear) with zero candidates at all. */
  gaps: Category[];
}

/* ── constants ───────────────────────────────────────────────── */

/** Slots required for a complete look — flagged as gaps when the closet has none at all. */
const CORE_SLOTS: Category[] = ["top", "bottom", "footwear"];

/** Send at most this many candidates; most closets are smaller → effectively the whole closet. */
const TOTAL_CAP = 58;
/** Guarantee this many of each core category survive the cap, so nothing starves. */
const MIN_PER_CORE = 10;

/* ── helpers ─────────────────────────────────────────────────── */

/**
 * Returns true if the item's subtype (or a detail tag) is explicitly excluded
 * by a "no <thing>" constraint. This is the ONLY hard exclusion in this module —
 * everything else (formality, weather, occasion, aesthetic) is a soft score.
 */
function violatesConstraints(tags: GarmentTags, constraints: string[]): boolean {
  for (const c of constraints) {
    const m = c.toLowerCase().match(/^no\s+(.+)$/);
    if (!m) continue;
    const banned = m[1].trim();
    if (tags.subtype?.toLowerCase().includes(banned)) return true;
    if (tags.details?.some(d => d.toLowerCase().includes(banned))) return true;
  }
  return false;
}

/**
 * Numeric score for a garment against the intent. Higher = better fit, but a
 * low/negative score never excludes an item — it only affects ranking and,
 * for oversized closets, which items make the cap.
 */
function scoreItem(tags: GarmentTags, intent: StylingIntent): number {
  let score = 0;

  // Formality proximity — soft, never excludes. A 10-target and a 2-score item
  // just contributes 0 rather than being removed from the pool.
  score += Math.max(0, 5 - Math.abs((tags.formalityScore ?? 5) - intent.formalityTargetScore));

  // Weather — a gentle nudge, not a gate. A weather mismatch used to hard-exclude
  // the whole category (that's what starved the closet); now it costs one point.
  if (intent.weather !== "unspecified" && tags.weatherCompatibility?.length) {
    score += tags.weatherCompatibility.includes(intent.weather) ? 2 : -1;
  }

  // Occasion
  if (tags.occasions?.includes(intent.occasion)) score += 3;
  else if (tags.occasions?.includes("everyday")) score += 1;

  // Aesthetic — primary matching signal now that `style` carries up to 3 tags.
  for (const a of intent.aesthetic) {
    if (tags.style?.some(s => s.toLowerCase() === a.toLowerCase())) score += 2;
  }

  // Vibe — loose free-text overlap against style tags.
  for (const v of intent.vibe) {
    if (tags.style?.some(s => s.toLowerCase().includes(v.toLowerCase()) ||
                               v.toLowerCase().includes(s.toLowerCase()))) {
      score += 1;
    }
  }

  return score;
}

/* ── main export ──────────────────────────────────────────────── */
export function selectCandidates(
  items: WardrobeItemRow[],
  intent: StylingIntent,
): FilterResult {
  const scored: ScoredItem[] = items
    .filter(i => i.data?.isGarment && i.data.category !== "unclear")
    .filter(i => !violatesConstraints(i.data!, intent.constraints))
    .map(i => ({ ...i, _score: scoreItem(i.data!, intent) }));

  let shortlist: ScoredItem[];
  if (scored.length <= TOTAL_CAP) {
    shortlist = [...scored].sort((a, b) => b._score - a._score);
  } else {
    // Large closet: guarantee MIN_PER_CORE of each core category survives, then
    // fill the rest of the cap by global score.
    const byCat = new Map<string, ScoredItem[]>();
    for (const item of scored) {
      const cat = item.category ?? "unclear";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat)!.push(item);
    }
    const kept = new Set<string>();
    for (const c of CORE_SLOTS) {
      (byCat.get(c) ?? [])
        .sort((a, b) => b._score - a._score)
        .slice(0, MIN_PER_CORE)
        .forEach(i => kept.add(i.id));
    }
    const guaranteed = scored.filter(i => kept.has(i.id));
    const rest = scored.filter(i => !kept.has(i.id)).sort((a, b) => b._score - a._score);
    shortlist = [...guaranteed, ...rest]
      .slice(0, TOTAL_CAP)
      .sort((a, b) => b._score - a._score);
  }

  const presentCategories = new Set(shortlist.map(i => i.category));
  const gaps = CORE_SLOTS.filter(slot => !presentCategories.has(slot));

  return { shortlist, gaps };
}
