import { createClient } from "@/lib/supabase/client";

/** Upload an already-processed (cropped + white-balanced) skin image and
 *  record a dedicated `kind:"skin"` scan. Returns the new scan id. */
export async function uploadSkinScan(dataUrl: string): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const [head, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(head)?.[1] ?? "image/jpeg";
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: mime });

  const path = `${user.id}/scans/${crypto.randomUUID()}.jpg`;
  const { error: upErr } = await supabase.storage
    .from("user-media")
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (upErr) throw upErr;

  const { data, error } = await supabase
    .from("scans")
    .insert({ user_id: user.id, storage_path: path, kind: "skin" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}
