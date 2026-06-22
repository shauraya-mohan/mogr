/**
 * Client-side quality-gate maths for the skin scan (spec §5–§6).
 * Pure functions over MediaPipe Face Mesh landmarks + canvas pixels.
 * Thresholds lean lenient — the goal is to block clearly-bad shots, not to be
 * a strict bouncer that rejects usable ones.
 */
import type { GateReason } from "./content";

export interface Landmark {
  x: number;
  y: number;
  z?: number;
}

// Face Mesh landmark indices we rely on.
const IDX = {
  leftEyeOuter: 33,
  rightEyeOuter: 263,
  nose: 1,
  leftFace: 234,
  rightFace: 454,
  chin: 152,
  foreheadTop: 10,
};

/** Tight-ish face bounding box (normalised 0–1) with margin, clamped. */
export function faceBBox(lm: Landmark[], margin = 0.25) {
  let minX = 1,
    minY = 1,
    maxX = 0,
    maxY = 0;
  for (const p of lm) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const w = maxX - minX;
  const h = maxY - minY;
  const mx = w * margin;
  const my = h * margin;
  return {
    x: Math.max(0, minX - mx),
    y: Math.max(0, minY - my),
    w: Math.min(1, maxX + mx) - Math.max(0, minX - mx),
    h: Math.min(1, maxY + my) - Math.max(0, minY - my),
  };
}

/** Front-facing + upright check from landmark geometry. */
export function assessPose(lm: Landmark[]): { ok: boolean; reason?: GateReason } {
  const le = lm[IDX.leftEyeOuter];
  const re = lm[IDX.rightEyeOuter];
  const nose = lm[IDX.nose];
  const lf = lm[IDX.leftFace];
  const rf = lm[IDX.rightFace];
  if (!le || !re || !nose || !lf || !rf) return { ok: true };

  const span = rf.x - lf.x || 1e-6;
  const yawOffset = (nose.x - lf.x) / span - 0.5; // 0 = centered
  const roll = (Math.atan2(re.y - le.y, re.x - le.x) * 180) / Math.PI;

  if (Math.abs(yawOffset) > 0.14 || Math.abs(roll) > 13) {
    return { ok: false, reason: "pose" };
  }
  return { ok: true };
}

/**
 * Lighting + sharpness over the face region only.
 * `data` is the ImageData of the cropped face region.
 */
export function assessQuality(data: ImageData): { ok: boolean; reason?: GateReason } {
  const { data: px, width, height } = data;
  const n = width * height;
  if (!n) return { ok: true };

  // grayscale + per-half brightness + Laplacian variance (sharpness)
  const gray = new Float32Array(n);
  let sum = 0;
  let leftSum = 0;
  let rightSum = 0;
  let leftN = 0;
  let rightN = 0;
  const half = width / 2;
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    const g = 0.299 * px[p] + 0.587 * px[p + 1] + 0.114 * px[p + 2];
    gray[i] = g;
    sum += g;
    const x = i % width;
    if (x < half) {
      leftSum += g;
      leftN++;
    } else {
      rightSum += g;
      rightN++;
    }
  }
  const mean = sum / n;
  const leftMean = leftN ? leftSum / leftN : mean;
  const rightMean = rightN ? rightSum / rightN : mean;
  const uneven = Math.abs(leftMean - rightMean);

  if (mean < 55) return { ok: false, reason: "dark" };
  if (mean > 212) return { ok: false, reason: "bright" };
  if (uneven > 70) return { ok: false, reason: "dark" }; // harsh side-light

  // Laplacian variance (4-neighbour) on the interior.
  let lapSum = 0;
  let lapSq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const lap =
        gray[i - 1] + gray[i + 1] + gray[i - width] + gray[i + width] - 4 * gray[i];
      lapSum += lap;
      lapSq += lap * lap;
      count++;
    }
  }
  if (count) {
    const m = lapSum / count;
    const variance = lapSq / count - m * m;
    if (variance < 12) return { ok: false, reason: "blurry" };
  }
  return { ok: true };
}

/**
 * Crop the source canvas to the face bbox and apply a gray-world white-balance,
 * returning a JPEG data URL ready to upload. `bbox` is normalised 0–1.
 */
export function cropAndWhiteBalance(
  source: HTMLCanvasElement,
  bbox: { x: number; y: number; w: number; h: number },
  outEdge = 768,
): string {
  const sx = Math.round(bbox.x * source.width);
  const sy = Math.round(bbox.y * source.height);
  const sw = Math.round(bbox.w * source.width);
  const sh = Math.round(bbox.h * source.height);

  const scale = Math.min(1, outEdge / Math.max(sw, sh));
  const ow = Math.max(1, Math.round(sw * scale));
  const oh = Math.max(1, Math.round(sh * scale));

  const out = document.createElement("canvas");
  out.width = ow;
  out.height = oh;
  const ctx = out.getContext("2d");
  if (!ctx) return source.toDataURL("image/jpeg", 0.9);
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, ow, oh);

  // gray-world white balance
  const img = ctx.getImageData(0, 0, ow, oh);
  const d = img.data;
  let rs = 0,
    gs = 0,
    bs = 0;
  const total = ow * oh;
  for (let p = 0; p < d.length; p += 4) {
    rs += d[p];
    gs += d[p + 1];
    bs += d[p + 2];
  }
  const rA = rs / total || 1;
  const gA = gs / total || 1;
  const bA = bs / total || 1;
  const gray = (rA + gA + bA) / 3;
  const kr = gray / rA;
  const kg = gray / gA;
  const kb = gray / bA;
  for (let p = 0; p < d.length; p += 4) {
    d[p] = Math.min(255, d[p] * kr);
    d[p + 1] = Math.min(255, d[p + 1] * kg);
    d[p + 2] = Math.min(255, d[p + 2] * kb);
  }
  ctx.putImageData(img, 0, 0);
  return out.toDataURL("image/jpeg", 0.9);
}
