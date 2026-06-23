"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/Button";
import { ImageUploadTrigger } from "@/components/app/ImageUpload";
import { SKIN_COPY, SKIN_TIPS, GATE_REASONS, type GateReason } from "@/lib/skin/content";
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
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [ready, setReady] = useState(false);
  const [gateOn, setGateOn] = useState(true); // false if MediaPipe can't load
  const [passing, setPassing] = useState(false);
  const [reason, setReason] = useState<GateReason | null>("no-face");
  const [capturing, setCapturing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [useUpload, setUseUpload] = useState(false);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (scanTimer.current) clearTimeout(scanTimer.current);
    scanTimer.current = null;
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
        if (faces.length === 0) {
          lastLm.current = null;
          setReason("no-face");
          setPassing(false);
        } else if (faces.length > 1) {
          setReason("multi-face");
          setPassing(false);
        } else {
          const lm = faces[0];
          lastLm.current = lm;
          const pose = assessPose(lm);
          if (!pose.ok) {
            setReason(pose.reason ?? "pose");
            setPassing(false);
          } else {
            const q = sampleQuality(video, lm);
            if (q && !q.ok) {
              setReason(q.reason ?? "dark");
              setPassing(false);
            } else {
              setReason(null);
              setPassing(true);
            }
          }
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

  // Run the scan-sweep, then grab the frame at the end (like the hair scan).
  function handleCapture() {
    if (!videoRef.current || capturing || scanning || (gateOn && !passing)) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setScanning(true);
    scanTimer.current = setTimeout(grab, reduced ? 320 : 1900);
  }

  function grab() {
    const video = videoRef.current;
    if (!video) return;
    setScanning(false);
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
    // while the parent uploads + analyses.
    setPreview(c.toDataURL("image/jpeg", 0.85));
    const lm = lastLm.current;
    const dataUrl = lm ? cropAndWhiteBalance(c, faceBBox(lm, 0.25)) : c.toDataURL("image/jpeg", 0.9);
    stop();
    onCapture(dataUrl);
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

        {/* reticle — bronze when passing, stone otherwise */}
        {ready && !preview && !scanning && (
          <div
            className={`pointer-events-none absolute inset-6 rounded-[120px] border-2 transition-colors duration-300 ${
              passing ? "border-bronze/70" : "border-[#F4F2EC]/30"
            }`}
          />
        )}

        {/* status pill */}
        {ready && !preview && !scanning && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <span
              className={`flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.14em] backdrop-blur-md [text-shadow:0_1px_8px_rgba(0,0,0,0.5)] ${
                passing ? "bg-[rgba(176,122,60,0.22)] text-[#F4F2EC]" : "bg-black/40 text-[#F4F2EC]/85"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${passing ? "bg-bronze" : "bg-[#F4F2EC]/60"}`} />
              {statusText}
            </span>
          </div>
        )}

        {/* Active scan-sweep (like the hair scan) before the frame is grabbed */}
        {scanning && !preview && (
          <div className="absolute inset-0 z-[5]">
            <div className="absolute inset-0 bg-black/15" />
            <div className="scan-sweep">
              <div className="scan-sweep__line" />
              <div className="scan-sweep__glow" />
            </div>
            <span className="absolute left-1/2 top-5 -translate-x-1/2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#F4F2EC] [text-shadow:0_1px_10px_rgba(0,0,0,0.6)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bronze" />
              scanning
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

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-stone max-w-[46ch]">
        {SKIN_COPY.consent}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <Button
          onClick={handleCapture}
          size="lg"
          disabled={!ready || capturing || scanning || (gateOn && !passing)}
        >
          {scanning ? "Scanning…" : capturing ? SKIN_COPY.scanning : SKIN_COPY.capture}
        </Button>
        <button
          type="button"
          onClick={() => setUseUpload(true)}
          disabled={capturing || scanning}
          className="font-mono text-[13px] text-graphite transition-colors duration-[400ms] hover:text-bronze disabled:opacity-50"
        >
          {SKIN_COPY.upload}
        </button>
      </div>
      </div>

      {/* Concise capture guidance */}
      <aside className="hidden lg:block sticky top-[calc(var(--header-h)+32px)] pt-[44px]">
        <p className="eyebrow mb-4">get a clean read</p>
        <ul className="grid gap-3.5">
          {SKIN_TIPS.map((t) => (
            <li key={t.label} className="flex gap-3 text-[14px] leading-relaxed">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-bronze" />
              <span className="text-graphite">
                <span className="font-medium text-ink">{t.label}.</span> {t.text}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
