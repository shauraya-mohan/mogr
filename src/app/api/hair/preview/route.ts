import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { editImage } from "@/lib/openai";
import { previewPrompt } from "@/lib/hair/content";

export const runtime = "nodejs";
export const maxDuration = 120;

const SIGNED_TTL = 60 * 60; // 1h

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { styleId } = (await req.json().catch(() => ({}))) as { styleId?: string };
  if (!styleId) return NextResponse.json({ error: "missing-style" }, { status: 400 });

  const { data: style } = await supabase
    .from("hair_styles")
    .select("id, name, full_brief, preview_path, status, scan_id")
    .eq("id", styleId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!style) return NextResponse.json({ error: "style-not-found" }, { status: 404 });

  // Already rendered → just hand back a fresh signed URL.
  if (style.preview_path && style.status === "ready") {
    const { data: signed } = await supabase.storage
      .from("user-media")
      .createSignedUrl(style.preview_path, SIGNED_TTL);
    return NextResponse.json({ url: signed?.signedUrl, cached: true });
  }

  // Resolve the source selfie (the one tied to this style, else latest).
  let selfiePath: string | null = null;
  if (style.scan_id) {
    const { data: s } = await supabase
      .from("scans")
      .select("storage_path")
      .eq("id", style.scan_id)
      .maybeSingle();
    selfiePath = s?.storage_path ?? null;
  }
  if (!selfiePath) {
    const { data: s } = await supabase
      .from("scans")
      .select("storage_path")
      .eq("user_id", user.id)
      .eq("kind", "selfie")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    selfiePath = s?.storage_path ?? null;
  }
  if (!selfiePath) return NextResponse.json({ error: "no-scan" }, { status: 400 });

  const { data: file, error: dlErr } = await supabase.storage
    .from("user-media")
    .download(selfiePath);
  if (dlErr || !file)
    return NextResponse.json({ error: "selfie-unavailable" }, { status: 400 });

  // Face-preserving edit.
  let b64: string;
  try {
    b64 = await editImage({
      image: file,
      prompt: previewPrompt(style.name, style.full_brief ?? ""),
      size: "1024x1536",
      quality: "low", // ~33s vs ~58s at medium; previews don't need full fidelity

    });
  } catch (e) {
    await supabase.from("hair_styles").update({ status: "failed" }).eq("id", style.id);
    return NextResponse.json({ error: "render-failed", detail: String(e) }, { status: 502 });
  }

  // Store the result + mark ready.
  const path = `${user.id}/previews/${crypto.randomUUID()}.png`;
  const bytes = Buffer.from(b64, "base64");
  const { error: upErr } = await supabase.storage
    .from("user-media")
    .upload(path, bytes, { contentType: "image/png", upsert: false });
  if (upErr)
    return NextResponse.json({ error: "store-failed", detail: upErr.message }, { status: 500 });

  await supabase
    .from("hair_styles")
    .update({ preview_path: path, status: "ready" })
    .eq("id", style.id);

  const { data: signed } = await supabase.storage
    .from("user-media")
    .createSignedUrl(path, SIGNED_TTL);

  return NextResponse.json({ url: signed?.signedUrl, cached: false });
}
