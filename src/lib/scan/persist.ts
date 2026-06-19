import { createClient } from "@/lib/supabase/client";
import { resizeSelfie } from "./storage";

const BUCKET = "user-media";

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(head)?.[1] ?? "image/jpeg";
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/**
 * Resize the captured selfie, upload it to the private `user-media` bucket at
 * `{userId}/scans/<uuid>.jpg`, and record it in the `scans` table. Returns the
 * new scan id + storage path. The selfie is the shared input reused by the
 * skin / hair / facial-hair features.
 */
export async function uploadSelfie(
  dataUrl: string,
): Promise<{ scanId: string; path: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const resized = await resizeSelfie(dataUrl);
  const blob = dataUrlToBlob(resized);
  const path = `${user.id}/scans/${crypto.randomUUID()}.jpg`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from("scans")
    .insert({ user_id: user.id, storage_path: path, kind: "selfie" })
    .select("id")
    .single();
  if (error) throw error;

  return { scanId: data.id as string, path };
}
