const KEY = "mogr-selfie";
const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.85;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Resize to max longest edge and return a JPEG data URL. */
export async function resizeSelfie(source: string): Promise<string> {
  const img = await loadImage(source);
  const { naturalWidth: w, naturalHeight: h } = img;
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export async function saveSelfie(source: string): Promise<void> {
  const dataUrl = await resizeSelfie(source);
  sessionStorage.setItem(KEY, dataUrl);
}

export function getSelfie(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(KEY);
}

export function clearSelfie(): void {
  sessionStorage.removeItem(KEY);
}

export function hasSelfie(): boolean {
  return getSelfie() !== null;
}
