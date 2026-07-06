import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatJSON } from "@/lib/openai";
import {
  INTERPRETER_SYSTEM,
  FORMALITY_BAND,
  type StylingIntent,
} from "@/lib/wardrobe/interpreter";
import { preFilter } from "@/lib/wardrobe/filter";
import { callStylist } from "@/lib/wardrobe/stylist";
import type { WardrobeItemRow, OutfitPiece, OutfitSlot, Outfit } from "@/lib/wardrobe/content";
import type { Palette } from "@/lib/wardrobe/palette";

export const runtime = "nodejs";
export const maxDuration = 60;

const SLOT_MAP: Record<string, OutfitSlot> = {
  top: "top",
  bottom: "bottom",
  footwear: "footwear",
  outerwear: "layer",
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const chips: string[]          = Array.isArray(body.chips)  ? body.chips  : [];
  const prompt: string           = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const mode: "closet_only" | "hybrid" =
    body.mode === "hybrid" ? "hybrid" : "closet_only";
  const avoidItemIds: string[]   = Array.isArray(body.avoidItemIds) ? body.avoidItemIds : [];

  /* ── Stage 1: interpret the request ─────────────────────────── */
  let intent: StylingIntent;
  try {
    const raw = await chatJSON<Omit<StylingIntent, "mode">>({
      system: INTERPRETER_SYSTEM,
      user: JSON.stringify({ chips, prompt }),
      temperature: 0,
    });

    const target = raw.formalityTarget ?? "casual";
    const validBand = FORMALITY_BAND[target] ?? [target];
    const band = Array.isArray(raw.formalityBand)
      ? raw.formalityBand.filter((f: string) => validBand.includes(f))
      : validBand;

    const season = Array.isArray(raw.season) ? raw.season : ["all-season"];
    if (!season.includes("all-season")) season.push("all-season");

    intent = {
      occasion:        raw.occasion        ?? "everyday",
      formalityTarget: target,
      formalityBand:   band.length ? band : validBand,
      season,
      vibe:            Array.isArray(raw.vibe)        ? raw.vibe        : [],
      constraints:     Array.isArray(raw.constraints) ? raw.constraints : [],
      mode,
    };
  } catch (e) {
    return NextResponse.json(
      { error: "interpret-failed", detail: String(e) },
      { status: 502 },
    );
  }

  /* ── Stage 2: pre-filter wardrobe ───────────────────────────── */
  const { data: rawItems } = await supabase
    .from("wardrobe_items")
    .select("id, category, name, color, image_url, data, created_at")
    .eq("user_id", user.id);

  const { shortlist: rawShortlist, gaps } = preFilter(
    (rawItems ?? []) as WardrobeItemRow[],
    intent,
  );

  // Exclude items the user has already seen (try-again flow)
  const avoidSet = new Set(avoidItemIds);
  const shortlist = rawShortlist.filter(i => !avoidSet.has(i.id));

  /* ── Stage 3: stylist ────────────────────────────────────────── */
  const { data: profile } = await supabase
    .from("profiles")
    .select("undertone, hair_tone, palette")
    .eq("id", user.id)
    .maybeSingle();

  let outfits: Outfit[] = [];
  try {
    const raw = await callStylist(
      shortlist,
      intent,
      profile?.undertone ?? undefined,
      (profile?.palette ?? null) as Palette | null,
    );

    // Enrich itemIds → OutfitPiece[] for the visual components
    const itemMap = new Map(shortlist.map(i => [i.id, i]));
    outfits = raw.map(o => ({
      ...o,
      pieces: o.itemIds
        .map(id => {
          const item = itemMap.get(id);
          if (!item) return null;
          const slot = SLOT_MAP[item.category ?? ""];
          if (!slot) return null;
          return {
            name: item.name ?? item.data?.name ?? "item",
            tint: item.data?.colors?.[0]?.hex ?? "#888888",
            slot,
          } satisfies OutfitPiece;
        })
        .filter((p): p is OutfitPiece => p !== null),
    }));
  } catch (e) {
    return NextResponse.json(
      { error: "stylist-failed", detail: String(e) },
      { status: 502 },
    );
  }

  return NextResponse.json({ outfits, intent, gaps });
}
