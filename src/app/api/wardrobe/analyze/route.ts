import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatJSON } from "@/lib/openai";
import {
  INTERPRETER_SYSTEM,
  SEASON_WEATHER_BASELINE,
  type StylingIntent,
} from "@/lib/wardrobe/interpreter";
import { selectCandidates } from "@/lib/wardrobe/filter";
import { callStylist } from "@/lib/wardrobe/stylist";
import { withinRateLimit, rateLimitedResponse } from "@/lib/rateLimit";
import type { WardrobeItemRow, OutfitPiece, OutfitSlot, Outfit, StyleSeason } from "@/lib/wardrobe/content";
import { STYLE_SEASON_OPTIONS } from "@/lib/wardrobe/content";

export const runtime = "nodejs";
export const maxDuration = 60;

const SLOT_MAP: Record<string, OutfitSlot> = {
  top: "top",
  bottom: "bottom",
  footwear: "footwear",
  outerwear: "layer",
  accessory: "accessory",
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // Two LLM calls per request (interpreter + stylist), no caching — "try again"
  // in the UI is a deliberate re-roll, so this can't be cache-gated like the others.
  if (!(await withinRateLimit(supabase, "wardrobe-analyze", 30, 3600))) return rateLimitedResponse();

  const body = await req.json().catch(() => ({}));
  const chips: string[]          = Array.isArray(body.chips)  ? body.chips  : [];
  const prompt: string           = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const mode: "closet_only" | "hybrid" =
    body.mode === "hybrid" ? "hybrid" : "closet_only";
  const season: StyleSeason =
    STYLE_SEASON_OPTIONS.includes(body.season) ? body.season : "summer";
  const avoidOutfits: string[][] =
    Array.isArray(body.avoidOutfits)
      ? body.avoidOutfits.filter((o: unknown): o is string[] => Array.isArray(o))
      : [];

  /* ── Stage 1: interpret the request ─────────────────────────── */
  let intent: StylingIntent;
  try {
    const raw = await chatJSON<Omit<StylingIntent, "mode">>({
      system: INTERPRETER_SYSTEM,
      user: JSON.stringify({ chips, season, prompt }),
    });

    const weatherOptions = ["hot", "mild", "cold", "rain", "unspecified"];
    const weather = weatherOptions.includes(raw.weather)
      ? raw.weather
      : SEASON_WEATHER_BASELINE[season];

    intent = {
      occasion:              raw.occasion ?? "everyday",
      formalityTargetScore:  Math.min(10, Math.max(1, Number(raw.formalityTargetScore) || 5)),
      aesthetic:             Array.isArray(raw.aesthetic)   ? raw.aesthetic   : [],
      weather:               weather as StylingIntent["weather"],
      vibe:                  Array.isArray(raw.vibe)        ? raw.vibe        : [],
      dressCodeNotes:        typeof raw.dressCodeNotes === "string" ? raw.dressCodeNotes : "",
      constraints:           Array.isArray(raw.constraints) ? raw.constraints : [],
      mode,
    };
  } catch (e) {
    console.error("[analyze] Stage 1 interpret-failed:", e);
    return NextResponse.json(
      { error: "interpret-failed", detail: String(e) },
      { status: 502 },
    );
  }

  /* ── Stage 2: select candidates ──────────────────────────────── */
  const { data: rawItems } = await supabase
    .from("wardrobe_items")
    .select("id, category, name, color, image_url, data, created_at")
    .eq("user_id", user.id);

  const { shortlist, gaps } = selectCandidates(
    (rawItems ?? []) as WardrobeItemRow[],
    intent,
  );

  /* ── Stage 3: stylist ────────────────────────────────────────── */
  let outfits: Outfit[] = [];
  try {
    const raw = await callStylist(shortlist, intent, avoidOutfits);

    // Enrich itemIds → OutfitPiece[] for the visual components
    const itemMap = new Map(shortlist.map(i => [i.id, i]));

    // Collect all unique storage paths that need signed URLs
    const BUCKET = "user-media";
    const SIGNED_TTL = 60 * 60; // 1h
    const pathsToSign = new Set<string>();
    for (const o of raw) {
      for (const id of o.itemIds) {
        const item = itemMap.get(id);
        if (item?.image_url) pathsToSign.add(item.image_url);
      }
    }
    // Batch-sign all cutout paths
    const signedMap = new Map<string, string>();
    if (pathsToSign.size > 0) {
      const { data: signedResults } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls([...pathsToSign], SIGNED_TTL);
      if (signedResults) {
        const pathArr = [...pathsToSign];
        signedResults.forEach((r, i) => {
          if (r.signedUrl) signedMap.set(pathArr[i], r.signedUrl);
        });
      }
    }

    outfits = raw.map(o => ({
      ...o,
      pieces: o.itemIds
        .map((id): OutfitPiece | null => {
          const item = itemMap.get(id);
          if (!item) return null;
          const slot = SLOT_MAP[item.category ?? ""];
          if (!slot) return null;
          return {
            name: item.name ?? item.data?.name ?? "item",
            tint: item.data?.colors?.[0]?.hex ?? "#888888",
            slot,
            cutoutUrl: item.image_url ? (signedMap.get(item.image_url) ?? null) : null,
            itemId: item.id,
          };
        })
        .filter((p): p is OutfitPiece => p !== null),
    }));
  } catch (e) {
    console.error("[analyze] Stage 3 stylist-failed:", e);
    return NextResponse.json(
      { error: "stylist-failed", detail: String(e) },
      { status: 502 },
    );
  }

  return NextResponse.json({ outfits, intent, gaps });
}
