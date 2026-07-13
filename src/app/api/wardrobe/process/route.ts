import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { visionJSON } from "@/lib/openai";
import { ghostMannequin } from "@/lib/wardrobe/photoroom";
import { withinRateLimit, rateLimitedResponse } from "@/lib/rateLimit";
import { TAG_SYSTEM, TAG_USER } from "@/lib/wardrobe/tagging";
import type { GarmentTags } from "@/lib/wardrobe/content";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "user-media";
const SIGNED_TTL = 60 * 60; // 1h

/**
 * Garment scan pipeline for ONE image:
 *   original → Photoroom ghost mannequin (clean cutout) → store cutout →
 *   OpenAI vision tagging on the cutout → return { cutoutPath, cutoutUrl, tags }.
 *
 * The row is NOT written here — the client commits it (with any tag edits) via
 * a supabase insert, so a cancelled single scan leaves no orphan row. Rejected
 * (non-garment) images have their cutout removed before returning.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  // No cache here — every call spends a Photoroom cutout + a vision tag call.
  // Headroom is wide since building out a closet means dozens of these in a row.
  if (!(await withinRateLimit(supabase, "wardrobe-process", 60, 3600))) return rateLimitedResponse();

  const form = await req.formData().catch(() => null);
  const image = form?.get("image");
  if (!(image instanceof Blob)) {
    return NextResponse.json({ error: "missing-image" }, { status: 400 });
  }

  // 1) Ghost-mannequin cutout (sandbox in dev, live in prod).
  let cutout: Buffer;
  try {
    cutout = await ghostMannequin(image);
  } catch (e) {
    return NextResponse.json({ error: "cutout-failed", detail: String(e) }, { status: 502 });
  }

  // 2) Store the cutout (owner-only path).
  const path = `${user.id}/wardrobe/${crypto.randomUUID()}.png`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, cutout, { contentType: "image/png", upsert: false });
  if (upErr) {
    return NextResponse.json({ error: "store-failed", detail: upErr.message }, { status: 500 });
  }

  // 3) Tag the clean cutout.
  let tags: GarmentTags;
  try {
    tags = await visionJSON<GarmentTags>({
      system: TAG_SYSTEM,
      user: TAG_USER,
      imageDataUrl: `data:image/png;base64,${cutout.toString("base64")}`,
    });
  } catch (e) {
    await supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: "tag-failed", detail: String(e) }, { status: 502 });
  }

  // 4) Not a garment → clean up, tell the UI to reject.
  if (!tags.isGarment) {
    await supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ isGarment: false });
  }

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_TTL);

  return NextResponse.json({
    isGarment: true,
    cutoutPath: path,
    cutoutUrl: signed?.signedUrl ?? null,
    tags,
  });
}
