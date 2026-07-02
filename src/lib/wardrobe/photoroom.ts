/**
 * Server-only Photoroom helper. The key lives in process.env.PHOTOROOM_API_KEY
 * and must never reach the browser.
 *
 * Ghost Mannequin (Image Editing API) turns a photo of a single garment into a
 * clean "invisible mannequin" cutout on a transparent background — the
 * consistent look for the wardrobe grid. In development we prepend `sandbox_`
 * to the key: free, watermarked test calls that don't burn live credits.
 */
import "server-only";

const RAW = process.env.PHOTOROOM_API_KEY;
const ENDPOINT = "https://image-api.photoroom.com/v2/edit";

function apiKey(): string {
  if (!RAW) throw new Error("PHOTOROOM_API_KEY is not set");
  // Live in production; sandbox (free, watermarked) everywhere else.
  if (process.env.NODE_ENV === "production") return RAW;
  return RAW.startsWith("sandbox_") ? RAW : `sandbox_${RAW}`;
}

/** Are we returning watermarked sandbox cutouts? (dev) */
export function isSandbox(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Ghost-mannequin a single garment photo. Returns the cutout as a PNG buffer
 * (transparent background). Throws on non-2xx — the caller retries / surfaces it.
 * Failed calls don't consume Photoroom credits.
 */
export async function ghostMannequin(image: Blob): Promise<Buffer> {
  const form = new FormData();
  form.append("imageFile", image, "garment.png");
  form.append("ghostMannequin.mode", "ai.auto");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "x-api-key": apiKey() },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Photoroom ${res.status}: ${await res.text().catch(() => "")}`);
  }
  return Buffer.from(await res.arrayBuffer());
}
