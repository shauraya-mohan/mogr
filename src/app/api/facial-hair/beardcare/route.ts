import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatJSON } from "@/lib/openai";
import { canonical } from "@/lib/cacheKey";
import { BEARDCARE_SYSTEM_PROMPT, type BeardcareAnswers } from "@/lib/facial-hair/content";

export const runtime = "nodejs";
export const maxDuration = 60;

interface BeardcareTips {
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
  const answers = (body?.beardcare ?? {}) as BeardcareAnswers;

  // Prior facial-hair read for context + any cached beardcare result.
  // beardcare lives in the generic `data` jsonb (facial_hair_profiles has no
  // dedicated column) as data.beardcare = { answers, tips }.
  const { data: fp } = await supabase
    .from("facial_hair_profiles")
    .select("growth, density, summary, data")
    .eq("user_id", user.id)
    .maybeSingle();

  const data = (fp?.data ?? {}) as { beardcare?: { answers?: BeardcareAnswers; tips?: BeardcareTips } };
  const prev = data.beardcare ?? null;
  if (prev?.tips && prev.answers && canonical(prev.answers) === canonical(answers)) {
    return NextResponse.json({ tips: prev.tips, cached: true });
  }

  let tips: BeardcareTips;
  try {
    tips = await chatJSON<BeardcareTips>({
      system: BEARDCARE_SYSTEM_PROMPT,
      user: `Facial-hair read: ${JSON.stringify({
        growth: fp?.growth ?? null,
        density: fp?.density ?? null,
      })}. Beard-care questionnaire: ${JSON.stringify(answers)}. Write the routine per the schema.`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "beardcare-failed", detail: String(e) },
      { status: 502 },
    );
  }

  // Persist answers + tips, merged into the existing data jsonb (owner RLS).
  await supabase
    .from("facial_hair_profiles")
    .upsert({ user_id: user.id, data: { ...data, beardcare: { answers, tips } } });

  return NextResponse.json({ tips });
}
