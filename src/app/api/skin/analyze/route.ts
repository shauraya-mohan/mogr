import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { visionJSON, chatJSON } from "@/lib/openai";
import { canonical } from "@/lib/cacheKey";
import {
  SKIN_ANALYSIS_PROMPT,
  SKIN_ROUTINE_PROMPT,
  SKIN_CONCERN_IDS,
  type SkinRead,
  type SkinConcern,
  type SkinRoutine,
  type Severity,
  type SkinQuestionnaire,
} from "@/lib/skin/content";

export const runtime = "nodejs";
export const maxDuration = 90;

const SKIN_MODEL = process.env.OPENAI_SKIN_MODEL || "gpt-5-chat-latest";
const RUNS = 3; // self-consistency

const SEV_ORDER: Severity[] = ["none", "mild", "moderate", "strong", "unclear"];

function mode<T>(items: T[]): T | undefined {
  const counts = new Map<T, number>();
  for (const it of items) counts.set(it, (counts.get(it) ?? 0) + 1);
  let best: T | undefined;
  let bestN = 0;
  for (const [k, n] of counts) if (n > bestN) ((best = k), (bestN = n));
  return best;
}

/** Majority-vote each concern + skin type across the self-consistency runs. */
function mergeReads(reads: SkinRead[]): SkinRead {
  const base = reads[0];
  const concerns: SkinConcern[] = SKIN_CONCERN_IDS.map((id) => {
    const entries = reads
      .map((r) => r.concerns?.find((c) => c.id === id))
      .filter(Boolean) as SkinConcern[];
    const severity =
      mode(entries.map((e) => e.severity)) ?? ("unclear" as Severity);
    const visible = entries.filter((e) => e.visible).length > entries.length / 2;
    const regions = Array.from(new Set(entries.flatMap((e) => e.regions ?? [])));
    return {
      id,
      label: entries[0]?.label ?? id,
      severity,
      visible,
      regions: visible ? regions : [],
    };
  });
  // keep severities to a known set
  for (const c of concerns)
    if (!SEV_ORDER.includes(c.severity)) c.severity = "unclear";

  return {
    faceDetected: reads.every((r) => r.faceDetected),
    imageUsable: reads.every((r) => r.imageUsable),
    skinShade: mode(reads.map((r) => r.skinShade)) ?? base.skinShade ?? "Medium",
    skinType: {
      value: mode(reads.map((r) => r.skinType?.value)) ?? base.skinType?.value ?? "normal",
      confidence: base.skinType?.confidence ?? "medium",
      basis: base.skinType?.basis ?? "fused",
    },
    concerns,
    zoneSummary: base.zoneSummary ?? { t_zone: "", u_zone: "" },
  };
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const scanId = body?.scanId as string | undefined;
  const questionnaire = (body?.questionnaire ?? {}) as SkinQuestionnaire;
  if (!scanId) return NextResponse.json({ error: "missing-scan" }, { status: 400 });

  // Verify the scan belongs to the user.
  const { data: scan } = await supabase
    .from("scans")
    .select("id, storage_path")
    .eq("id", scanId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!scan) return NextResponse.json({ error: "scan-not-found" }, { status: 404 });

  // Cache: same scan + same questionnaire → return the stored read/routine.
  const { data: existing } = await supabase
    .from("skin_profiles")
    .select("data, questionnaire, scan_id")
    .eq("user_id", user.id)
    .maybeSingle();
  const cached = existing?.data as { read?: SkinRead; routine?: SkinRoutine } | null;
  if (
    cached?.read &&
    cached?.routine &&
    existing?.scan_id === scanId &&
    existing?.questionnaire &&
    canonical(existing.questionnaire) === canonical(questionnaire)
  ) {
    return NextResponse.json({ read: cached.read, routine: cached.routine, cached: true });
  }

  // Download the (already gated/cropped) image.
  const { data: file, error: dlErr } = await supabase.storage
    .from("user-media")
    .download(scan.storage_path);
  if (dlErr || !file)
    return NextResponse.json({ error: "image-unavailable" }, { status: 400 });
  const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const imageDataUrl = `data:image/jpeg;base64,${b64}`;
  const userMsg = `User questionnaire: ${JSON.stringify(questionnaire)}. Assess the photo per the schema.`;

  // Self-consistency: run the vision read N times (temp 0) and merge.
  let reads: SkinRead[];
  try {
    reads = await Promise.all(
      Array.from({ length: RUNS }, () =>
        visionJSON<SkinRead>({
          system: SKIN_ANALYSIS_PROMPT,
          user: userMsg,
          imageDataUrl,
          model: SKIN_MODEL,
          temperature: 0,
        }),
      ),
    );
  } catch (e) {
    return NextResponse.json({ error: "analysis-failed", detail: String(e) }, { status: 502 });
  }

  const read = mergeReads(reads);
  if (!read.faceDetected || !read.imageUsable) {
    return NextResponse.json({ error: "unusable-image" }, { status: 422 });
  }

  // Routine + coaching (text only, temp 0).
  let routine: SkinRoutine;
  try {
    routine = await chatJSON<SkinRoutine>({
      system: SKIN_ROUTINE_PROMPT,
      user: `Skin read: ${JSON.stringify(read)}. Questionnaire: ${JSON.stringify(questionnaire)}. Write the routine per the schema.`,
      model: SKIN_MODEL,
      temperature: 0,
    });
  } catch (e) {
    return NextResponse.json({ error: "routine-failed", detail: String(e) }, { status: 502 });
  }

  // Persist.
  await supabase.from("skin_profiles").upsert({
    user_id: user.id,
    scan_id: scanId,
    skin_type: read.skinType.value,
    concerns: read.concerns.filter((c) => c.visible).map((c) => c.id),
    routine,
    summary: routine.summary,
    questionnaire,
    data: { read, routine },
  });
  // Skin shade is a shared, scan-derived attribute (like face_shape from the
  // hair/facial-hair scans) — denormalise it onto profiles for cross-feature
  // reads (dashboard now, wardrobe later).
  await supabase.from("profiles").update({ skin_shade: read.skinShade }).eq("id", user.id);

  return NextResponse.json({ read, routine, cached: false });
}
