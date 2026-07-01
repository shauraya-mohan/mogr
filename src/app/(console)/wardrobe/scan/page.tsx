"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { DETECTED, PROCESSING_STATUS } from "@/lib/wardrobe/content";
import { useReveal } from "@/lib/wardrobe/useReveal";
import EditableTag from "@/components/wardrobe/EditableTag";

type ScanState = "capture" | "processing" | "result" | "rejected";

export default function WardrobeScanPage() {
  const [state, setState] = useState<ScanState>("capture");
  const [procIdx, setProcIdx] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  useReveal(stageRef, [state]);

  // Processing → result. TODO(backend): this stands in for the Photoroom
  // cutout + VLM tagging round-trip (POST /api/wardrobe/items → poll). Resolve
  // to "result" on success, or "rejected" if the tagger returns isGarment:false.
  useEffect(() => {
    if (state !== "processing") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setProcIdx(0);
    const step = reduced ? 350 : 1100;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < PROCESSING_STATUS.length; i++) {
      timers.push(setTimeout(() => setProcIdx(i), step * i));
    }
    timers.push(setTimeout(() => setState("result"), reduced ? 900 : 3500));
    return () => timers.forEach(clearTimeout);
  }, [state]);

  return (
    <div className="scan-flow" data-screen-label="wardrobe-scan">
      {/* Top bar: back + wordmark + close */}
      <div className="scan-topbar">
        <Link className="scan-nav-btn" href="/wardrobe" aria-label="Back to wardrobe">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          back
        </Link>
        <span className="scan-wordmark">
          mogr<span className="dot">.</span>
        </span>
        <Link className="scan-nav-btn" href="/wardrobe" aria-label="Close scan flow">
          close
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
      </div>

      <div className="scan-stage" ref={stageRef}>
        {/* STATE 1 — CAPTURE */}
        {state === "capture" && (
          <section className="scan-state is-current" data-state="capture">
            <div className="scan-state__inner">
              <p className="scan-step-label">Scan · one item at a time</p>

              {/* Live-camera viewport / upload drop zone.
                  TODO(backend): attach getUserMedia() stream here (mirror
                  CameraCapture.tsx); on "upload instead", swap in a file drop. */}
              <div className="viewport">
                <div className="viewport__reticle">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <span className="viewport__hint">
                  <span className="rec" />
                  camera preview
                </span>
              </div>

              <p className="capture-guidance">
                Lay it flat or hang it. Good light, plain background. One piece at
                a time.
              </p>

              <div className="capture-actions">
                <button className="btn btn-lg" type="button" onClick={() => setState("processing")}>
                  <span className="btn-dot" />
                  Capture
                </button>
                <button className="text-link" type="button" onClick={() => setState("processing")}>
                  upload instead
                </button>
              </div>

              <p className="progress-hint">Item 4 of your wardrobe</p>
            </div>
          </section>
        )}

        {/* STATE 2 — PROCESSING */}
        {state === "processing" && (
          <section className="scan-state is-current" data-state="processing">
            <div className="scan-state__inner">
              <p className="scan-step-label">Working on it</p>
              <div className="proc-card">
                <div className="skeleton" />
              </div>
              <div className="status-lines">
                {PROCESSING_STATUS.map((line, i) => (
                  <p key={i} className={`status-line${i === procIdx ? " is-current" : ""}`}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* STATE 3 — RESULT / CONFIRM */}
        {state === "result" && (
          <section className="scan-state is-current" data-state="result">
            <div className="scan-state__inner" style={{ maxWidth: 820 }}>
              <div className="result-grid">
                {/* clean ghost-mannequin cutout (the payoff).
                    TODO(backend) IMAGE SLOT: replace .garment-ph with the
                    returned Photoroom cutout <img>. */}
                <div className="result-cutout rise">
                  <div className="garment-ph" style={{ "--tint": "#6B6B3A" } as CSSProperties}>
                    <span className="garment-ph__label">
                      cutout
                      <br />
                      overshirt
                    </span>
                  </div>
                </div>

                <div className="rise" data-rise-delay="0.1">
                  <p className="tags-label">we detected — tap to fix anything</p>
                  <div className="tag-list">
                    {DETECTED.map((field) => (
                      <div className="tag-row" key={field.key}>
                        <span className="tag-row__key">{field.key}</span>
                        <EditableTag field={field} />
                      </div>
                    ))}
                  </div>

                  <div className="result-actions">
                    {/* TODO(backend): confirm overrides → the item is already
                        created; this just returns to the closet. */}
                    <Link className="btn btn-lg" href="/wardrobe?added=1">
                      <span className="btn-dot" />
                      Add to wardrobe
                    </Link>
                    <button
                      className="btn btn-secondary btn-lg"
                      type="button"
                      onClick={() => setState("capture")}
                    >
                      Scan another
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* STATE 4 — REJECTED */}
        {state === "rejected" && (
          <section className="scan-state is-current" data-state="rejected">
            <div className="scan-state__inner">
              <div className="rejected-card">
                <div className="rejected-card__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.34 2.23l.58 3.47A1 1 0 0 0 3.83 10H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.17a1 1 0 0 0 .99-.8l.58-3.47a2 2 0 0 0-1.34-2.23z" />
                    <path d="M3 3l18 18" strokeWidth="1.6" />
                  </svg>
                </div>
                <p>That doesn&apos;t look like a garment — try a clothing photo.</p>
                <button className="btn btn-lg" type="button" onClick={() => setState("capture")}>
                  <span className="btn-dot" />
                  Retake
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
