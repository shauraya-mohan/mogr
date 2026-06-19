import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { visionJSON } from "@/lib/openai";
import { HAIR_SYSTEM_PROMPT, type Questionnaire } from "@/lib/hair/content";

export const runtime = "nodejs";
export const maxDuration = 60;

interface AnalyzedStyle {
  slug: string;
  name: string;
  rationale: string;
  brief: string;
  full_brief: string;
}
interface VisionRead {
  face_shape: string;
  hair_type: string;
  density: string;
  length: string;
  summary: string;
  styles: AnalyzedStyle[];
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const questionnaire = (body?.questionnaire ?? {}) as Questionnaire;

  // Latest selfie for this user.
  const { data: scan } = await supabase
    .from("scans")
    .select("id, storage_path")
    .eq("user_id", user.id)
    .eq("kind", "selfie")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!scan) return NextResponse.json({ error: "no-scan" }, { status: 400 });

  // Download the selfie → data URL for the vision model.
  const { data: file, error: dlErr } = await supabase.storage
    .from("user-media")
    .download(scan.storage_path);
  if (dlErr || !file)
    return NextResponse.json({ error: "selfie-unavailable" }, { status: 400 });
  const b64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const imageDataUrl = `data:image/jpeg;base64,${b64}`;

  // Vision read.
  let read: VisionRead;
  try {
    read = await visionJSON<VisionRead>({
      system: HAIR_SYSTEM_PROMPT,
      user: `Questionnaire answers: ${JSON.stringify(questionnaire)}. Read this man's hair and recommend styles per the schema.`,
      imageDataUrl,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "analysis-failed", detail: String(e) },
      { status: 502 },
    );
  }

  const styles = (read.styles ?? []).slice(0, 5);

  // Persist: shared read → profiles; hair read → hair_profiles.
  await supabase.from("profiles").update({ face_shape: read.face_shape }).eq("id", user.id);
  await supabase.from("hair_profiles").upsert({
    user_id: user.id,
    scan_id: scan.id,
    hair_type: read.hair_type,
    density: read.density,
    length: read.length,
    questionnaire,
    summary: read.summary,
    recommended_styles: styles,
  });

  // Replace previous recommendations.
  await supabase.from("hair_styles").delete().eq("user_id", user.id);
  const { data: inserted, error: insErr } = await supabase
    .from("hair_styles")
    .insert(
      styles.map((s, i) => ({
        user_id: user.id,
        scan_id: scan.id,
        slug: s.slug,
        name: s.name,
        rationale: s.rationale,
        brief: s.brief,
        full_brief: s.full_brief,
        status: "pending",
        sort_order: i,
      })),
    )
    .select("id, slug, name, rationale, brief, full_brief, sort_order");
  if (insErr)
    return NextResponse.json({ error: "persist-failed", detail: insErr.message }, { status: 500 });

  return NextResponse.json({
    read: {
      face_shape: read.face_shape,
      hair_type: read.hair_type,
      density: read.density,
      length: read.length,
      summary: read.summary,
    },
    styles: inserted,
  });
}
