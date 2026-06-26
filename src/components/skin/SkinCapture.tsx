"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/Button";
import { ImageUploadTrigger } from "@/components/app/ImageUpload";
import { SKIN_COPY, SKIN_SIDE, SKIN_TIPS, GATE_REASONS, type GateReason } from "@/lib/skin/content";
import {
  assessPose,
  assessQuality,
  faceBBox,
  cropAndWhiteBalance,
  type Landmark,
} from "@/lib/skin/gate";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

interface SkinCaptureProps {
  onCapture: (dataUrl: string) => void;
  onError: (message: string) => void;
}

// Minimal shape of the MediaPipe FaceLandmarker we use.
interface Landmarker {
  detectForVideo: (v: HTMLVideoElement, ts: number) => { faceLandmarks: Landmark[][] };
  close: () => void;
}

export default function SkinCapture({ onCapture, onError }: SkinCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<Landmarker | null>(null);
  const lastLm = useRef<Landmark[] | null>(null);
  const rafRef = useRef<number | null>(null);
  const workCanvas = useRef<HTMLCanvasElement | null>(null);
  // Rolling window of recent per-frame verdicts (null = ok) for temporal
  // hysteresis — the gate decides over the window, not on a single jittery frame.
  const history = useRef<(GateReason | null)[]>([]);

  const [ready, setReady] = useState(false);
  const [gateOn, setGateOn] = useState(true); // false if MediaPipe can't load
  const [passing, setPassing] = useState(false);
  const [reason, setReason] = useState<GateReason | null>("no-face");
  const [capturing, setCapturing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [useUpload, setUseUpload] = useState(false);
  const [ringLight, setRingLight] = useState(false); // screen-based fill light

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
  }, []);

  useEffect(() => {
    if (useUpload) {
      stop();
      return;
    }
    let cancelled = false;
    history.current = []; // fresh hysteresis window per camera session

    (async () => {
      // Camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setUseUpload(true);
          onError(GATE_REASONS["no-face"]);
        }
        return;
      }

      // MediaPipe (graceful: if it fails, allow manual capture without the gate)
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
        const fl = await vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL },
          runningMode: "VIDEO",
          numFaces: 2,
        });
        if (cancelled) return fl.close();
        landmarkerRef.current = fl as unknown as Landmarker;
        loop();
      } catch {
        setGateOn(false); // gate unavailable → manual capture allowed
        setPassing(true);
        setReason(null);
      }
    })();

    function loop() {
      const video = videoRef.current;
      const fl = landmarkerRef.current;
      if (!video || !fl || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      try {
        const res = fl.detectForVideo(video, performance.now());
        const faces = res.faceLandmarks ?? [];

        // Compute this frame's verdict (null = passes everything).
        let result: GateReason | null;
        if (faces.length === 0) {
          lastLm.current = null;
          result = "no-face";
        } else if (faces.length > 1) {
          result = "multi-face";
        } else {
          const lm = faces[0];
          lastLm.current = lm;
          const pose = assessPose(lm);
          if (!pose.ok) {
            result = pose.reason ?? "pose";
          } else {
            const q = sampleQuality(video, lm);
            result = q && !q.ok ? (q.reason ?? "dark") : null;
          }
        }

        // Temporal hysteresis: decide over the last WINDOW frames so a single
        // jittery/soft frame can't flip the status or block the shutter.
        const WINDOW = 6;
        const PASS_MIN = 4; // need a majority of recent frames to be clean
        const h = history.current;
        h.push(result);
        if (h.length > WINDOW) h.shift();
        const oks = h.reduce((acc, r) => acc + (r === null ? 1 : 0), 0);

        if (oks >= PASS_MIN) {
          setReason(null);
          setPassing(true);
        } else {
          // Show the most frequent failing reason in the window (stable copy),
          // falling back to this frame's reason.
          const counts = new Map<GateReason, number>();
          for (const r of h) if (r) counts.set(r, (counts.get(r) ?? 0) + 1);
          let top: GateReason | null = result;
          let topN = 0;
          for (const [k, nn] of counts) if (nn > topN) ((top = k), (topN = nn));
          setReason(top ?? "no-face");
          setPassing(false);
        }
      } catch {
        /* transient detect error — keep looping */
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    return () => {
      cancelled = true;
      stop();
    };
  }, [useUpload, stop, onError]);

  /** Sample the face-region pixels for the lighting/blur check. */
  function sampleQuality(video: HTMLVideoElement, lm: Landmark[]) {
    const c = (workCanvas.current ??= document.createElement("canvas"));
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) return null;
    c.width = vw;
    c.height = vh;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, vw, vh);
    const b = faceBBox(lm, 0.1);
    const sx = Math.max(0, Math.round(b.x * vw));
    const sy = Math.max(0, Math.round(b.y * vh));
    const sw = Math.min(vw - sx, Math.round(b.w * vw));
    const sh = Math.min(vh - sy, Math.round(b.h * vh));
    if (sw < 8 || sh < 8) return null;
    return assessQuality(ctx.getImageData(sx, sy, sw, sh));
  }

  // Grab the current frame immediately (no animation). The captured image is
  // the true camera orientation — NOT mirrored — even though the live preview
  // is flipped for natural selfie framing.
  function handleCapture() {
    const video = videoRef.current;
    if (!video || capturing || (gateOn && !passing)) return;
    setCapturing(true);
    const c = document.createElement("canvas");
    c.width = video.videoWidth;
    c.height = video.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) {
      setCapturing(false);
      return;
    }
    ctx.drawImage(video, 0, 0);
    // Freeze the shot for display so the box never shows a dead/black feed
    // while the parent transitions to the review screen.
    setPreview(c.toDataURL("image/jpeg", 0.85));
    const lm = lastLm.current;
    // Mirror the output so it matches the live selfie preview the user saw.
    const dataUrl = lm
      ? cropAndWhiteBalance(c, faceBBox(lm, 0.25), 768, true)
      : mirrorCanvas(c);
    stop();
    onCapture(dataUrl);
  }

  /** Return a horizontally-flipped JPEG data URL of a canvas (selfie match). */
  function mirrorCanvas(src: HTMLCanvasElement): string {
    const m = document.createElement("canvas");
    m.width = src.width;
    m.height = src.height;
    const mc = m.getContext("2d");
    if (!mc) return src.toDataURL("image/jpeg", 0.9);
    mc.translate(m.width, 0);
    mc.scale(-1, 1);
    mc.drawImage(src, 0, 0);
    return m.toDataURL("image/jpeg", 0.9);
  }

  // ── Upload fallback ──
  if (useUpload) {
    return (
      <div className="max-w-[560px]">
        <p className="eyebrow mb-4">{SKIN_COPY.gateEyebrow}</p>
        <h1 className="font-display text-[clamp(30px,5vw,44px)] font-bold leading-[0.95] tracking-[-0.04em] mb-4">
          {SKIN_COPY.gateTitle}
        </h1>
        <p className="text-graphite text-[15px] leading-relaxed max-w-[46ch] mb-6">
          Camera unavailable — upload a clear, front-facing photo in good light.
          Avoid beauty-mode / filtered shots.
        </p>
        <div className="flex flex-col items-center gap-4 rounded-[18px] border border-[var(--ink-08)] bg-cloud p-10">
          <ImageUploadTrigger label="Upload a photo" onSelect={onCapture} onError={onError} />
        </div>
      </div>
    );
  }

  const statusText = reason ? GATE_REASONS[reason] : "Looks good — hold still";

  return (
    <div className="grid items-start gap-[clamp(32px,5vw,64px)] lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
      <div>
        <p className="eyebrow mb-4">{SKIN_COPY.gateEyebrow}</p>
        <h1 className="font-display text-[clamp(30px,5vw,44px)] font-bold leading-[0.95] tracking-[-0.04em] mb-3">
          {SKIN_COPY.gateTitle}
        </h1>
        <p className="text-graphite text-[15px] leading-relaxed max-w-[46ch] mb-6">
          {SKIN_COPY.gateBody}
        </p>

        <div className="relative overflow-hidden rounded-[18px] border border-[var(--ink-08)] bg-cloud aspect-[3/4] max-h-[min(68vh,620px)]">
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
          />
          {!ready && !preview && (
            <div className="absolute inset-0 grid place-items-center">
              <p className="font-mono text-[13px] text-stone">{SKIN_COPY.starting}</p>
            </div>
          )}

          {/* Ring light — a bright white halo around the frame that uses the
              screen to throw fill light on the face (à la FaceTime). */}
          {ringLight && ready && !preview && (
            <div
              className="pointer-events-none absolute inset-0 z-[3] rounded-[18px]"
              style={{
                boxShadow:
                  "inset 0 0 0 18px rgba(255,255,255,0.96), inset 0 0 80px 26px rgba(255,255,255,0.7)",
              }}
            />
          )}

          {/* reticle — bronze when passing, stone otherwise */}
          {ready && !preview && (
            <div
              className={`pointer-events-none absolute inset-6 rounded-[120px] border-2 transition-colors duration-300 ${passing ? "border-bronze/70" : "border-[#F4F2EC]/30"
                }`}
            />
          )}

          {/* status pill */}
          {ready && !preview && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center">
              <span
                className={`flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] backdrop-blur-md [text-shadow:0_1px_8px_rgba(0,0,0,0.5)] ${passing ? "bg-[rgba(176,122,60,0.22)] text-[#F4F2EC]" : "bg-black/40 text-[#F4F2EC]/85"
                  }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${passing ? "bg-bronze" : "bg-[#F4F2EC]/60"}`} />
                {statusText}
              </span>
            </div>
          )}

          {/* Frozen shot + processing — never a dead feed */}
          {preview && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Captured"
                className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
              />
              <div className="absolute inset-0 grid place-items-center bg-black/45">
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-bronze" />
                  <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#F4F2EC]">
                    {SKIN_COPY.scanning}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Ring light toggle */}
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={ringLight}
            aria-label="Toggle ring light"
            onClick={() => setRingLight((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${
              ringLight ? "bg-bronze" : "bg-[var(--ink-12)]"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-bone shadow-sm transition-transform duration-300 ${
                ringLight ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <p className="text-[14px] leading-snug text-graphite">
            <span className="font-medium text-ink">Ring light</span> — brighten your face using the screen
          </p>
        </div>

        <p className="mt-3 font-mono text-[11px] leading-relaxed text-stone max-w-[46ch]">
          {SKIN_COPY.consent}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Button
            onClick={handleCapture}
            size="lg"
            disabled={!ready || capturing || (gateOn && !passing)}
          >
            {capturing ? SKIN_COPY.scanning : SKIN_COPY.capture}
          </Button>
          <button
            type="button"
            onClick={() => setUseUpload(true)}
            disabled={capturing}
            className="font-mono text-[13px] text-graphite transition-colors duration-[400ms] hover:text-bronze disabled:opacity-50"
          >
            {SKIN_COPY.upload}
          </button>
        </div>
      </div>

      {/* Right: branding + live framing reminders (mirrors hair scan) */}
      <aside className="hidden lg:block sticky top-[calc(var(--header-h)+32px)] pt-[44px]">
        <p className="eyebrow mb-4">{SKIN_SIDE.eyebrow}</p>
        <h2 className="font-display font-bold text-[clamp(24px,2.4vw,32px)] tracking-[-0.03em] leading-[1.05] mb-4">
          {SKIN_SIDE.title}
          <span className="dot">.</span>
        </h2>
        <p className="text-graphite text-[15px] leading-relaxed max-w-[42ch] mb-8">
          {SKIN_SIDE.body}
        </p>

        <ul className="grid gap-4 mb-8">
          {SKIN_TIPS.map((t) => (
            <li key={t.label} className="flex gap-3 text-[16px] leading-relaxed">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-bronze" />
              <span className="text-graphite">
                <span className="text-ink font-medium">{t.label}.</span> {t.text}
              </span>
            </li>
          ))}
        </ul>

        <p className="font-mono text-[11px] tracking-[0.06em] leading-relaxed text-stone max-w-[42ch]">
          {SKIN_SIDE.privacy}
        </p>
      </aside>
    </div>
  );
}
