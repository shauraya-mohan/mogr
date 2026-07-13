import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatJSON } from "@/lib/openai";
import { canonical } from "@/lib/cacheKey";
import { withinRateLimit, rateLimitedResponse } from "@/lib/rateLimit";
import { HAIRCARE_SYSTEM_PROMPT, type HaircareAnswers } from "@/lib/hair/content";

export const runtime = "nodejs";
export const maxDuration = 60;

interface HaircareTips {
  summary: string;
  routine: { step: string; detail: string; cadence: string }[];
  products: { type: string; ingredient: string; why: string }[];
  styling: string[];
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const answers = (body?.haircare ?? {}) as HaircareAnswers;

  // Prior hair read for context + any cached haircare result.
  const { data: hp } = await supabase
    .from("hair_profiles")
    .select("hair_type, density, length, summary, haircare")
    .eq("user_id", user.id)
    .maybeSingle();

  // Cache: unchanged answers → return the stored routine (no model call).
  const prev = (hp?.haircare ?? null) as {
    answers?: HaircareAnswers;
    tips?: HaircareTips;
  } | null;
  if (prev?.tips && prev.answers && canonical(prev.answers) === canonical(answers)) {
    return NextResponse.json({ tips: prev.tips, cached: true });
  }

  if (!(await withinRateLimit(supabase, "hair-haircare", 20, 3600))) return rateLimitedResponse();

  let tips: HaircareTips;
  try {
    tips = await chatJSON<HaircareTips>({
      system: HAIRCARE_SYSTEM_PROMPT,
      user: `Hair read: ${JSON.stringify({
        hair_type: hp?.hair_type ?? null,
        density: hp?.density ?? null,
        length: hp?.length ?? null,
      })}. Haircare questionnaire: ${JSON.stringify(answers)}. Write the routine per the schema.`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "haircare-failed", detail: String(e) },
      { status: 502 },
    );
  }

  // Persist answers + tips on the user's hair profile (upsert, owner RLS).
  await supabase
    .from("hair_profiles")
    .upsert({ user_id: user.id, haircare: { answers, tips } });

  return NextResponse.json({ tips });
}
