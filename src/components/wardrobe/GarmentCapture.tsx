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

function CameraIcon() {
  return (
    <svg className="btn__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8.6A2 2 0 0 1 5 6.6h1.5l1-1.7a1 1 0 0 1 .85-.5h5.3a1 1 0 0 1 .85.5l1 1.7H19a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="12.4" r="3.2" />
    </svg>
  );
}

/**
 * Garment capture: live camera (rear on mobile / webcam on desktop) with a
 * snapshot button, single-photo upload, and bulk upload (up to BULK_LIMIT).
 * ONE <video> is always mounted so the stream stays attached (swapping the
 * element on a ready flag is what left the feed black before).
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
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
        }
      } catch {
        setError(true);
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

  const live = ready && !error;

  return (
    <div className="scan-state__inner">
      <p className="scan-step-label">Scan · one item at a time</p>

      <div className="viewport">
        <video
          ref={videoRef}
          className={`viewport__video${live ? " is-live" : ""}`}
          playsInline
          muted
          autoPlay
          onCanPlay={() => setReady(true)}
        />
        <div className="viewport__reticle" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </div>
        {!live && (
          <span className="viewport__hint">
            <span className="rec" />
            {error ? "camera unavailable, upload below" : "starting camera"}
          </span>
        )}
      </div>

      <p className="capture-guidance">
        Lay it flat or hang it. Good light, plain background. One piece at a time.
      </p>

      <div className="capture-actions">
        {live && (
          <button className="btn btn-lg" type="button" onClick={snapshot}>
            <CameraIcon />
            Capture
          </button>
        )}
        <button
          className={live ? "text-link" : "btn btn-lg"}
          type="button"
          onClick={() => singleInput.current?.click()}
        >
          {live ? (
            "upload a photo instead"
          ) : (
            <>
              <CameraIcon />
              Upload a photo
            </>
          )}
        </button>
        <button className="text-link" type="button" onClick={() => bulkInput.current?.click()}>
          upload multiple (up to {BULK_LIMIT})
        </button>
      </div>

      <input ref={singleInput} type="file" accept="image/*" hidden onChange={onSingle} />
      <input ref={bulkInput} type="file" accept="image/*" multiple hidden onChange={onBulk} />
    </div>
  );
}
