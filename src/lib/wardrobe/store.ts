"use client";

import { createClient } from "@/lib/supabase/client";
import { resizeSelfie } from "@/lib/scan/storage";
import type { GarmentTags, WardrobeItemRow } from "@/lib/wardrobe/content";

const BUCKET = "user-media";
const SIGNED_TTL = 60 * 60; // 1h

export interface ProcessResult {
  isGarment: boolean;
  cutoutPath?: string;
  cutoutUrl?: string | null;
  tags?: GarmentTags;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(head)?.[1] ?? "image/jpeg";
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * Run one garment image through the scan pipeline (cutout + tag). `source` is a
 * data URL (from camera capture or an uploaded file). Resized client-side first.
 */
export async function processGarment(source: string): Promise<ProcessResult> {
  const resized = await resizeSelfie(source); // generic downscale (max 1024, JPEG)
  const form = new FormData();
  form.append("image", dataUrlToBlob(resized), "garment.jpg");

  const res = await fetch("/api/wardrobe/process", { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `process failed (${res.status})`);
  }
  return (await res.json()) as ProcessResult;
}

/** Commit a processed garment to the wardrobe (with any tag edits applied). */
export async function saveGarment(cutoutPath: string, tags: GarmentTags): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase.from("wardrobe_items").insert({
    user_id: user.id,
    category: tags.category,
    name: tags.name,
    color: tags.colors?.[0]?.hex ?? null,
    image_url: cutoutPath, // cutout storage path — signed on read
    data: tags,
  });
  if (error) throw error;
}

/** Save edited tags back to an existing garment. */
export async function updateGarment(id: string, tags: GarmentTags): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("wardrobe_items")
    .update({
      category: tags.category,
      name: tags.name,
      color: tags.colors?.[0]?.hex ?? null,
      data: tags,
    })
    .eq("id", id);
  if (error) throw error;
}

/** The user's closet, newest first, each with a fresh signed cutout URL. */
export async function fetchWardrobe(): Promise<
  (WardrobeItemRow & { cutoutUrl: string | null })[]
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("wardrobe_items")
    .select("id, category, name, color, image_url, data, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = (data ?? []) as WardrobeItemRow[];
  return Promise.all(
    rows.map(async (row) => {
      let cutoutUrl: string | null = null;
      if (row.image_url) {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(row.image_url, SIGNED_TTL);
        cutoutUrl = signed?.signedUrl ?? null;
      }
      return { ...row, cutoutUrl };
    })
  );
}

/** Remove a garment (row + its cutout object). */
export async function deleteGarment(id: string, cutoutPath: string | null): Promise<void> {
  const supabase = createClient();
  if (cutoutPath) {
    await supabase.storage.from(BUCKET).remove([cutoutPath]);
  }
  const { error } = await supabase.from("wardrobe_items").delete().eq("id", id);
  if (error) throw error;
}
