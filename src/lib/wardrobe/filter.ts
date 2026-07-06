/**
 * Stage 2 — deterministic wardrobe pre-filter. No AI, no randomness.
 * Takes the full wardrobe + a StylingIntent → shortlist of ~10–20 items
 * grouped and ranked by category, plus a list of needed-but-empty gaps.
 */

import type { WardrobeItemRow, GarmentTags, Category } from "./content";
import type { StylingIntent } from "./interpreter";

/* ── types ──────────────────────────────────────────────────── */
export interface ScoredItem extends WardrobeItemRow {
  _score: number;
}

export interface FilterResult {
  /** ~10–20 ranked items the stylist will reason over. */
  shortlist: ScoredItem[];
  /** Category slots needed for the occasion that have zero candidates. */
  gaps: Category[];
}

/* ── constants ───────────────────────────────────────────────── */

/** Slots required for a complete look — always flagged as gaps when empty. */
const CORE_SLOTS: Category[] = ["top", "bottom", "footwear"];

/** Max survivors per category before trimming. 4 × 5 categories = 20 max. */
const CAP_PER_CATEGORY = 4;

/* ── helpers ─────────────────────────────────────────────────── */
function overlaps(a: string[], b: string[]): boolean {
  return a.some(v => b.includes(v));
}

/**
 * Returns true if the item's subtype is explicitly excluded by a constraint.
 * Only matches "no <thing>" patterns against the item subtype — colour/weather
 * constraints are left to the stylist.
 */
function violatesConstraints(tags: GarmentTags, constraints: string[]): boolean {
  for (const c of constraints) {
    const m = c.toLowerCase().match(/^no\s+(.+)$/);
    if (!m) continue;
    const banned = m[1].trim();
    if (tags.subtype?.toLowerCase().includes(banned)) return true;
    // also check detail tags (e.g. "no hood")
    if (tags.details?.some(d => d.toLowerCase().includes(banned))) return true;
  }
  return false;
}

/**
 * Numeric score for a garment against the intent.
 * Higher = better fit. Used for ranking within each category.
 *
 * exact occasion match  +3
 * "everyday" fallback   +1
 * exact formality       +2
 * adjacent formality    +1   (in band but not exact target)
 * style/vibe overlap    +1 per matching tag
 */
function scoreItem(tags: GarmentTags, intent: StylingIntent): number {
  let score = 0;

  // Occasion
  if (tags.occasions?.includes(intent.occasion)) score += 3;
  else if (tags.occasions?.includes("everyday")) score += 1;

  // Formality
  if (tags.formality === intent.formalityTarget) score += 2;
  else if (intent.formalityBand.includes(tags.formality)) score += 1;

  // Vibe — the intent vibe tags are free-text ("understated", "layered");
  // match loosely against the item's style array.
  for (const v of intent.vibe) {
    if (tags.style?.some(s => s.toLowerCase().includes(v.toLowerCase()) ||
                               v.toLowerCase().includes(s.toLowerCase()))) {
      score += 1;
    }
  }

  return score;
}

/* ── main export ──────────────────────────────────────────────── */
export function preFilter(
  items: WardrobeItemRow[],
  intent: StylingIntent,
): FilterResult {
  // Season the filter will accept (item must overlap this OR be "all-season")
  const targetSeasons = [...intent.season, "all-season"];

  // Gather and score survivors
  const candidates: ScoredItem[] = [];

  for (const item of items) {
    const tags = item.data;
    if (!tags?.isGarment) continue;
    if (tags.category === "unclear") continue;

    // Hard filters
    if (!intent.formalityBand.includes(tags.formality)) continue;
    if (!overlaps(tags.occasions ?? [], [intent.occasion, "everyday"])) continue;
    if (!overlaps([...(tags.season ?? []), "all-season"], targetSeasons)) continue;
    if (violatesConstraints(tags, intent.constraints)) continue;

    candidates.push({ ...item, _score: scoreItem(tags, intent) });
  }

  // Group by category, sort by score descending, cap per category
  const byCategory = new Map<string, ScoredItem[]>();
  for (const item of candidates) {
    const cat = item.category ?? "unclear";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(item);
  }
  for (const [cat, group] of byCategory) {
    byCategory.set(cat, group.sort((a, b) => b._score - a._score).slice(0, CAP_PER_CATEGORY));
  }

  // Flatten to shortlist
  const shortlist: ScoredItem[] = [];
  for (const group of byCategory.values()) shortlist.push(...group);

  // Gap detection — core slots with zero survivors
  const presentCategories = new Set(shortlist.map(i => i.category));
  const gaps = CORE_SLOTS.filter(slot => !presentCategories.has(slot));

  return { shortlist, gaps };
}
