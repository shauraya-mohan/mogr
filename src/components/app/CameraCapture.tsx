"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/Button";
import { ImageUploadTrigger } from "./ImageUpload";
import { SCAN_CAPTURE, SCAN_GUIDE } from "@/lib/scan/content";

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onError: (message: string) => void;
}

export default function CameraCapture({ onCapture, onError }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [useUpload, setUseUpload] = useState(false);
  const [scanning, setScanning] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  useEffect(() => {
    if (useUpload) {
      stopStream();
      return;
    }

    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
          setCameraFailed(false);
        }
      } catch {
        if (!cancelled) {
          setCameraFailed(true);
          setUseUpload(true);
          onError(SCAN_CAPTURE.cameraError);
        }
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [useUpload, stopStream, onError]);

  // Clear a pending scan timer if we unmount mid-scan.
  useEffect(() => () => {
    if (scanTimer.current) clearTimeout(scanTimer.current);
  }, []);

  function grabFrame() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    stopStream();
    onCapture(dataUrl);
  }

  // Run the scan sweep, then capture the frame at the end of it.
  function handleCapture() {
    if (scanning || !ready) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setScanning(true);
    scanTimer.current = setTimeout(grabFrame, reduced ? 320 : 2200);
  }

  if (useUpload) {
    return (
      <div className="max-w-[560px]">
        <p className="eyebrow mb-4">{SCAN_CAPTURE.eyebrow}</p>
        <h1 className="font-display font-bold text-[clamp(32px,6vw,48px)] tracking-[-0.04em] leading-[0.95] mb-4">
          {SCAN_CAPTURE.title}
        </h1>
        {cameraFailed && (
          <p className="text-graphite text-[15px] mb-6 max-w-[46ch]">{SCAN_CAPTURE.cameraError}</p>
        )}
        <div className="bg-cloud border border-[var(--ink-08)] rounded-[18px] p-10 flex flex-col items-center gap-4">
          <ImageUploadTrigger
            label={SCAN_CAPTURE.upload}
            onSelect={onCapture}
            onError={onError}
          />
          {!cameraFailed && (
            <button
              type="button"
              onClick={() => setUseUpload(false)}
              className="font-mono text-[13px] text-stone transition-colors duration-[400ms] hover:text-bronze"
            >
              {SCAN_CAPTURE.useCamera}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid items-start gap-[clamp(32px,5vw,64px)] lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
      {/* ── Left: live camera + actions ── */}
      <div>
        <p className="eyebrow mb-4">{SCAN_CAPTURE.eyebrow}</p>
        <h1 className="font-display font-bold text-[clamp(32px,6vw,48px)] tracking-[-0.04em] leading-[0.95] mb-6">
          {SCAN_CAPTURE.title}
        </h1>

        <div className="relative overflow-hidden rounded-[18px] border border-[var(--ink-08)] bg-cloud aspect-[3/4] max-h-[min(70vh,640px)]">
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover scale-x-[-1]"
          />

          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-mono text-[13px] text-stone">Starting camera…</p>
            </div>
          )}

          {/* Ambient scanner reticle — makes the live feed read as a scanner */}
          {ready && (
            <div className="pointer-events-none absolute inset-5 z-[4]">
              <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-[6px] border-l-2 border-t-2 border-bronze/50" />
              <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-[6px] border-r-2 border-t-2 border-bronze/50" />
              <span className="absolute left-0 bottom-0 h-6 w-6 rounded-bl-[6px] border-l-2 border-b-2 border-bronze/50" />
              <span className="absolute right-0 bottom-0 h-6 w-6 rounded-br-[6px] border-r-2 border-b-2 border-bronze/50" />
            </div>
          )}

          {/* Active scan: sweeping bronze line + scrim + centered HUD */}
          {scanning && (
            <div className="absolute inset-0 z-[5]">
              <div className="absolute inset-0 bg-black/15" />
              <div className="scan-sweep">
                <div className="scan-sweep__line" />
                <div className="scan-sweep__glow" />
              </div>
              <span className="absolute left-1/2 top-5 -translate-x-1/2 flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] uppercase text-[#F4F2EC] [text-shadow:0_1px_10px_rgba(0,0,0,0.6)]">
                <span className="h-1.5 w-1.5 rounded-full bg-bronze animate-pulse" />
                scanning
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Button onClick={handleCapture} size="lg" disabled={!ready || scanning}>
            {scanning ? SCAN_CAPTURE.scanning : SCAN_CAPTURE.capture}
          </Button>
          <button
            type="button"
            onClick={() => setUseUpload(true)}
            disabled={scanning}
            className="font-mono text-[13px] text-graphite transition-colors duration-[400ms] hover:text-bronze disabled:opacity-50"
          >
            {SCAN_CAPTURE.upload}
          </button>
        </div>
      </div>

      {/* ── Right: branding + live framing reminders ── */}
      <aside className="hidden lg:block sticky top-[calc(var(--header-h)+32px)] pt-[44px]">
        <p className="eyebrow mb-4">{SCAN_CAPTURE.sideEyebrow}</p>
        <h2 className="font-display font-bold text-[clamp(24px,2.4vw,32px)] tracking-[-0.03em] leading-[1.05] mb-4">
          {SCAN_CAPTURE.sideTitle}
          <span className="dot">.</span>
        </h2>
        <p className="text-graphite text-[15px] leading-relaxed max-w-[42ch] mb-8">
          {SCAN_CAPTURE.sideBody}
        </p>

        <ul className="grid gap-3.5 mb-8">
          {SCAN_GUIDE.tips.map((tip) => (
            <li key={tip.label} className="flex gap-3 text-[14px] leading-relaxed">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-bronze" />
              <span className="text-graphite">
                <span className="text-ink font-medium">{tip.label}.</span> {tip.text}
              </span>
            </li>
          ))}
        </ul>

        <p className="font-mono text-[11px] tracking-[0.06em] leading-relaxed text-stone max-w-[42ch]">
          {SCAN_GUIDE.privacy}
        </p>
      </aside>
    </div>
  );
}
