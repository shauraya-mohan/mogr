"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Button from "@/components/Button";
import { ImageUploadTrigger } from "./ImageUpload";
import { SCAN_CAPTURE } from "@/lib/scan/content";

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  onError: (message: string) => void;
}

export default function CameraCapture({ onCapture, onError }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [useUpload, setUseUpload] = useState(false);

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

  function handleCapture() {
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
    <div className="max-w-[560px]">
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
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button onClick={handleCapture} size="lg" disabled={!ready}>
          {SCAN_CAPTURE.capture}
        </Button>
        <button
          type="button"
          onClick={() => setUseUpload(true)}
          className="font-mono text-[13px] text-graphite transition-colors duration-[400ms] hover:text-bronze"
        >
          {SCAN_CAPTURE.upload}
        </button>
      </div>
    </div>
  );
}
