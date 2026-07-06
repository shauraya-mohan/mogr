import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatJSON } from "@/lib/openai";
import {
  INTERPRETER_SYSTEM,
  FORMALITY_BAND,
  type StylingIntent,
} from "@/lib/wardrobe/interpreter";
import { preFilter } from "@/lib/wardrobe/filter";
import type { WardrobeItemRow } from "@/lib/wardrobe/content";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const chips: string[]          = Array.isArray(body.chips)  ? body.chips  : [];
  const prompt: string           = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const mode: "closet_only" | "hybrid" =
    body.mode === "hybrid" ? "hybrid" : "closet_only";

  /* ── Stage 1: interpret the request ─────────────────────────── */
  let intent: StylingIntent;
  try {
    const raw = await chatJSON<Omit<StylingIntent, "mode">>({
      system: INTERPRETER_SYSTEM,
      user: JSON.stringify({ chips, prompt }),
      temperature: 0,
    });

    // Validate + correct the formalityBand against the target
    const target = raw.formalityTarget ?? "casual";
    const validBand = FORMALITY_BAND[target] ?? [target];
    const band = Array.isArray(raw.formalityBand)
      ? raw.formalityBand.filter((f: string) => validBand.includes(f))
      : validBand;

    // Always include "all-season" in season
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

  const { shortlist, gaps } = preFilter(
    (rawItems ?? []) as WardrobeItemRow[],
    intent,
  );

  /* ── Stage 3: stylist (TODO) ─────────────────────────────────── */

  return NextResponse.json({ intent, shortlist, gaps });
}
