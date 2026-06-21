import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * DELETE /api/scans/:id
 *
 * Deletes a scan and all associated data:
 * 1. The scan's selfie file from storage
 * 2. Any hair_style preview images linked to this scan
 * 3. The hair_styles rows themselves (scan_id FK is SET NULL, so we delete explicitly)
 * 4. The scan row
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Fetch the scan to verify ownership & get storage_path.
  const { data: scan, error: scanErr } = await supabase
    .from("scans")
    .select("id, user_id, storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (scanErr || !scan)
    return NextResponse.json({ error: "not-found" }, { status: 404 });

  // Collect storage paths to remove (scan selfie + any generated previews).
  const pathsToRemove: string[] = [scan.storage_path];

  const { data: styles } = await supabase
    .from("hair_styles")
    .select("id, preview_path")
    .eq("scan_id", id)
    .eq("user_id", user.id);

  if (styles?.length) {
    for (const s of styles) {
      if (s.preview_path) pathsToRemove.push(s.preview_path);
    }
    // Delete the hair_styles rows tied to this scan.
    await supabase
      .from("hair_styles")
      .delete()
      .eq("scan_id", id)
      .eq("user_id", user.id);
  }

  // Clear scan_id on hair_profiles if it references this scan.
  await supabase
    .from("hair_profiles")
    .update({ scan_id: null })
    .eq("scan_id", id)
    .eq("user_id", user.id);

  // Delete the scan row.
  const { error: delErr } = await supabase
    .from("scans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (delErr)
    return NextResponse.json(
      { error: "delete-failed", detail: delErr.message },
      { status: 500 },
    );

  // Clean up storage (best-effort; don't fail the request if storage errors).
  if (pathsToRemove.length) {
    await supabase.storage.from("user-media").remove(pathsToRemove);
  }

  return NextResponse.json({ ok: true });
}
