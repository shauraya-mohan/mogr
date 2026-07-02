"use client";

import { useEffect, useRef, useState } from "react";
import { BULK_LIMIT } from "@/lib/wardrobe/content";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * Garment capture: live camera (rear camera on mobile / webcam on desktop) with
 * a snapshot button, a single-photo upload, and a bulk upload (up to BULK_LIMIT).
 * Hands the parent an array of image data URLs — one for a single capture/upload,
 * many for a bulk selection.
 */
export default function GarmentCapture({
  onCapture,
}: {
  onCapture: (sources: string[]) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const singleInput = useRef<HTMLInputElement>(null);
  const bulkInput = useRef<HTMLInputElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraReady(true);
      } catch {
        setCameraError(true);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function snapshot() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    onCapture([canvas.toDataURL("image/jpeg", 0.9)]);
  }

  async function onSingle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onCapture([await fileToDataUrl(file)]);
  }

  async function onBulk(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, BULK_LIMIT);
    e.target.value = "";
    if (files.length) onCapture(await Promise.all(files.map(fileToDataUrl)));
  }

  return (
    <div className="scan-state__inner">
      <p className="scan-step-label">Scan · one item at a time</p>

      <div className="viewport">
        {cameraReady && !cameraError ? (
          <video ref={videoRef} playsInline muted />
        ) : (
          <>
            <div className="viewport__reticle">
              <span />
              <span />
              <span />
              <span />
            </div>
            <span className="viewport__hint">
              <span className="rec" />
              {cameraError ? "camera unavailable — upload below" : "starting camera…"}
            </span>
          </>
        )}
        {/* keep the video mounted so the stream attaches even before ready */}
        {!cameraReady && !cameraError && (
          <video ref={videoRef} playsInline muted style={{ display: "none" }} />
        )}
      </div>

      <p className="capture-guidance">
        Lay it flat or hang it. Good light, plain background. One piece at a time.
      </p>

      <div className="capture-actions">
        {cameraReady && !cameraError && (
          <button className="btn btn-lg" type="button" onClick={snapshot}>
            <span className="btn-dot" />
            Capture
          </button>
        )}
        <button
          className={cameraReady && !cameraError ? "text-link" : "btn btn-lg"}
          type="button"
          onClick={() => singleInput.current?.click()}
        >
          {cameraReady && !cameraError ? (
            "upload a photo instead"
          ) : (
            <>
              <span className="btn-dot" />
              Upload a photo
            </>
          )}
        </button>
        <button className="text-link" type="button" onClick={() => bulkInput.current?.click()}>
          upload multiple (up to {BULK_LIMIT})
        </button>
      </div>

      <input
        ref={singleInput}
        type="file"
        accept="image/*"
        hidden
        onChange={onSingle}
      />
      <input
        ref={bulkInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onBulk}
      />
    </div>
  );
}
