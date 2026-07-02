"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CATEGORY_OPTIONS,
  FIT_OPTIONS,
  FORMALITY_OPTIONS,
  PATTERN_OPTIONS,
  PROCESSING_STATUS,
  STYLE_OPTIONS,
  colourLabel,
  type GarmentTags,
} from "@/lib/wardrobe/content";
import { processGarment, saveGarment } from "@/lib/wardrobe/store";
import { useReveal } from "@/lib/wardrobe/useReveal";
import GarmentCapture from "@/components/wardrobe/GarmentCapture";
import EditableTag from "@/components/wardrobe/EditableTag";

type Mode = "capture" | "processing" | "result" | "rejected" | "bulk";

interface Single {
  cutoutPath: string;
  cutoutUrl: string | null;
  tags: GarmentTags;
}

interface Job {
  src: string;
  status: "processing" | "added" | "rejected" | "error";
  name?: string;
  cutoutUrl?: string | null;
}

const CONCURRENCY = 3;

function ScanSweep() {
  return (
    <div className="scan-sweep">
      <div className="scan-sweep__line" />
      <div className="scan-sweep__glow" />
    </div>
  );
}

export default function WardrobeScanPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("capture");
  const [procIdx, setProcIdx] = useState(0);
  const [pendingSrc, setPendingSrc] = useState<string | null>(null);

  const [single, setSingle] = useState<Single | null>(null);
  const [edited, setEdited] = useState<GarmentTags | null>(null);
  const [saving, setSaving] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);

  const stageRef = useRef<HTMLDivElement>(null);
  useReveal(stageRef, [mode, single, jobs.length]);

  // Cycle the status lines while a single scan runs (smooth crossfade in place).
  useEffect(() => {
    if (mode !== "processing") return;
    setProcIdx(0);
    const id = setInterval(
      () => setProcIdx((i) => (i + 1) % PROCESSING_STATUS.length),
      1500
    );
    return () => clearInterval(id);
  }, [mode]);

  function reset() {
    setSingle(null);
    setEdited(null);
    setPendingSrc(null);
    setJobs([]);
    setMode("capture");
  }

  async function onCapture(sources: string[]) {
    if (sources.length === 1) return startSingle(sources[0]);
    return startBulk(sources);
  }

  async function startSingle(src: string) {
    setPendingSrc(src);
    setMode("processing");
    try {
      const r = await processGarment(src);
      if (!r.isGarment || !r.tags || !r.cutoutPath) {
        setMode("rejected");
        return;
      }
      setSingle({ cutoutPath: r.cutoutPath, cutoutUrl: r.cutoutUrl ?? null, tags: r.tags });
      setEdited(r.tags);
      setMode("result");
    } catch {
      setMode("rejected");
    }
  }

  async function startBulk(sources: string[]) {
    setMode("bulk");
    setJobs(sources.map((src) => ({ src, status: "processing" })));

    let next = 0;
    const update = (idx: number, patch: Partial<Job>) =>
      setJobs((prev) => prev.map((j, i) => (i === idx ? { ...j, ...patch } : j)));
    const worker = async () => {
      while (next < sources.length) {
        const idx = next++;
        try {
          const r = await processGarment(sources[idx]);
          if (r.isGarment && r.tags && r.cutoutPath) {
            await saveGarment(r.cutoutPath, r.tags);
            update(idx, { status: "added", name: r.tags.name, cutoutUrl: r.cutoutUrl ?? null });
          } else {
            update(idx, { status: "rejected" });
          }
        } catch {
          update(idx, { status: "error" });
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, sources.length) }, worker));
  }

  async function addSingle() {
    if (!single || !edited) return;
    setSaving(true);
    try {
      await saveGarment(single.cutoutPath, edited);
      router.push("/wardrobe");
    } catch {
      setSaving(false);
    }
  }

  const setField = <K extends keyof GarmentTags>(key: K, value: GarmentTags[K]) =>
    setEdited((t) => (t ? { ...t, [key]: value } : t));

  const bulkDone = jobs.length > 0 && jobs.every((j) => j.status !== "processing");
  const addedCount = jobs.filter((j) => j.status === "added").length;

  const metaChips = edited
    ? [
        edited.material,
        ...(edited.season ?? []),
        ...(edited.occasions ?? []),
        ...(edited.details ?? []),
      ].filter((x) => x && x !== "unclear")
    : [];

  return (
    <div className="scan-flow" data-screen-label="wardrobe-scan">
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
        {/* CAPTURE */}
        {mode === "capture" && (
          <section className="scan-state is-current">
            <GarmentCapture onCapture={onCapture} />
          </section>
        )}

        {/* PROCESSING (single) */}
        {mode === "processing" && (
          <section className="scan-state is-current">
            <div className="scan-state__inner">
              <p className="scan-step-label">Working on it</p>
              <div className="proc-card">
                {pendingSrc && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="proc-shot" src={pendingSrc} alt="" />
                )}
                <ScanSweep />
              </div>
              <div className="status-lines">
                {PROCESSING_STATUS.map((line, i) => (
                  <p key={i} className={`status-line${i === procIdx ? " is-current" : ""}`}>
                    {line}
                  </p>
                ))}
              </div>
              <div className="proc-bar" aria-hidden>
                <span />
              </div>
            </div>
          </section>
        )}

        {/* RESULT (single) */}
        {mode === "result" && single && edited && (
          <section className="scan-state is-current">
            <div className="scan-state__inner" style={{ maxWidth: 860 }}>
              <div className="result-grid">
                <div className="result-cutout rise">
                  {single.cutoutUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="cutout" src={single.cutoutUrl} alt={edited.name} />
                  ) : (
                    <div className="garment-ph">
                      <span className="garment-ph__label">cutout</span>
                    </div>
                  )}
                </div>

                <div className="rise" data-rise-delay="0.1">
                  <p className="tags-label">Detected. Tap any tag to fix it.</p>

                  <div className="tag-list">
                    <div className="tag-row">
                      <span className="tag-row__key">Name</span>
                      <input
                        className="tag-input"
                        value={edited.name}
                        onChange={(e) => setField("name", e.target.value)}
                      />
                    </div>
                    <div className="tag-row">
                      <span className="tag-row__key">Category</span>
                      <EditableTag
                        value={edited.category}
                        options={CATEGORY_OPTIONS}
                        onChange={(v) => setField("category", v as GarmentTags["category"])}
                      />
                    </div>
                    <div className="tag-row">
                      <span className="tag-row__key">Type</span>
                      <input
                        className="tag-input"
                        value={edited.subtype}
                        onChange={(e) => setField("subtype", e.target.value)}
                      />
                    </div>
                    <div className="tag-row">
                      <span className="tag-row__key">Colours</span>
                      <div className="colour-chips">
                        {edited.colors.map((c, i) => (
                          <span className="swatch-chip is-readonly" key={i}>
                            <span className="mini-swatch" style={{ background: c.hex }} />
                            {colourLabel(c)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="tag-row">
                      <span className="tag-row__key">Pattern</span>
                      <EditableTag value={edited.pattern} options={PATTERN_OPTIONS} onChange={(v) => setField("pattern", v)} />
                    </div>
                    <div className="tag-row">
                      <span className="tag-row__key">Fit</span>
                      <EditableTag value={edited.fit} options={FIT_OPTIONS} onChange={(v) => setField("fit", v)} />
                    </div>
                    <div className="tag-row">
                      <span className="tag-row__key">Formality</span>
                      <EditableTag value={edited.formality} options={FORMALITY_OPTIONS} onChange={(v) => setField("formality", v)} />
                    </div>
                    <div className="tag-row">
                      <span className="tag-row__key">Style</span>
                      <EditableTag
                        value={edited.style[0] ?? "unclear"}
                        options={STYLE_OPTIONS}
                        onChange={(v) => setField("style", [v, ...edited.style.slice(1)])}
                      />
                    </div>
                  </div>

                  {metaChips.length > 0 && (
                    <div className="tag-chips">
                      {metaChips.map((m, i) => (
                        <span className="tag-chip" key={i}>
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="result-actions">
                    <button className="btn btn-lg" type="button" onClick={addSingle} disabled={saving}>
                      <span className="btn-dot" />
                      {saving ? "Adding" : "Add to wardrobe"}
                    </button>
                    <button className="btn btn-secondary btn-lg" type="button" onClick={reset}>
                      Scan another
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* BULK */}
        {mode === "bulk" && (
          <section className="scan-state is-current">
            <div className="scan-state__inner" style={{ maxWidth: 860 }}>
              <p className="scan-step-label">
                {bulkDone
                  ? `Added ${addedCount} of ${jobs.length}`
                  : `Processing ${jobs.filter((j) => j.status !== "processing").length} of ${jobs.length}`}
              </p>
              <div className="bulk-grid">
                {jobs.map((j, i) => (
                  <div className="bulk-cell" key={i}>
                    <div className="garment-card__stage">
                      {j.status === "added" && j.cutoutUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="cutout" src={j.cutoutUrl} alt={j.name ?? "garment"} />
                      ) : j.status === "processing" ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="bulk-shot" src={j.src} alt="" />
                          <ScanSweep />
                        </>
                      ) : (
                        <div className="garment-ph">
                          <span className="garment-ph__label">
                            {j.status === "rejected" ? "not a garment" : "failed"}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="bulk-cell__name">
                      {j.status === "processing"
                        ? "Reading"
                        : j.status === "added"
                        ? j.name
                        : j.status === "rejected"
                        ? "Skipped"
                        : "Failed"}
                    </p>
                  </div>
                ))}
              </div>
              {bulkDone && (
                <div className="result-actions" style={{ justifyContent: "center" }}>
                  <button className="btn btn-lg" type="button" onClick={() => router.push("/wardrobe")}>
                    <span className="btn-dot" />
                    Done
                  </button>
                  <button className="btn btn-secondary btn-lg" type="button" onClick={reset}>
                    Scan more
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* REJECTED (single) */}
        {mode === "rejected" && (
          <section className="scan-state is-current">
            <div className="scan-state__inner">
              <div className="rejected-card">
                <div className="rejected-card__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.34 2.23l.58 3.47A1 1 0 0 0 3.83 10H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.17a1 1 0 0 0 .99-.8l.58-3.47a2 2 0 0 0-1.34-2.23z" />
                    <path d="M3 3l18 18" strokeWidth="1.6" />
                  </svg>
                </div>
                <p>That does not look like a garment. Try a clothing photo.</p>
                <button className="btn btn-lg" type="button" onClick={reset}>
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
