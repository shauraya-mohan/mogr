"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Button from "@/components/Button";
import { createClient } from "@/lib/supabase/client";
import {
  HAIR_QUESTIONS,
  HAIR_COPY,
  type Questionnaire,
} from "@/lib/hair/content";

interface Style {
  id: string;
  slug: string | null;
  name: string;
  rationale: string | null;
  brief: string | null;
  full_brief: string | null;
  preview_path: string | null;
  status: string;
}
interface Read {
  face_shape: string | null;
  hair_type: string | null;
}

type Mode = "loading" | "need-scan" | "questionnaire" | "results";

export default function HairPage() {
  const [mode, setMode] = useState<Mode>("loading");
  const [answers, setAnswers] = useState<Partial<Questionnaire>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [read, setRead] = useState<Read>({ face_shape: null, hair_type: null });
  const [styles, setStyles] = useState<Style[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const inFlight = useRef<Set<string>>(new Set());

  // Slider comparison states and handlers
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [sliderVal, setSliderVal] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderVal(pct);
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove],
  );

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX);
      }
    },
    [isDragging, handleMove],
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp, onTouchMove]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };


  // ---- initial load: scan? existing recommendations? ----
  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: scan } = await supabase
        .from("scans")
        .select("id, storage_path")
        .eq("user_id", user.id)
        .eq("kind", "selfie")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!scan) {
        setMode("need-scan");
        return;
      }

      if (scan.storage_path) {
        const { data: signed } = await supabase.storage
          .from("user-media")
          .createSignedUrl(scan.storage_path, 3600);
        if (signed?.signedUrl) {
          setOriginalUrl(signed.signedUrl);
        }
      }

      const [{ data: hs }, { data: hp }, { data: prof }] = await Promise.all([
        supabase
          .from("hair_styles")
          .select("id, slug, name, rationale, brief, full_brief, preview_path, status")
          .eq("user_id", user.id)
          .order("sort_order", { ascending: true }),
        supabase.from("hair_profiles").select("hair_type").eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("face_shape").eq("id", user.id).maybeSingle(),
      ]);

      if (hs && hs.length) {
        setStyles(hs as Style[]);
        setRead({ face_shape: prof?.face_shape ?? null, hair_type: hp?.hair_type ?? null });
        setSelectedId(hs[0].id);
        setMode("results");
      } else {
        setMode("questionnaire");
      }
    })();
  }, []);

  // ---- ensure a style has an on-you preview ----
  // `silent` = background pre-generation (don't drive the main loading state).
  const ensurePreview = useCallback(
    async (style: Style, silent = false) => {
      if (previews[style.id] || inFlight.current.has(style.id)) return;
      inFlight.current.add(style.id);
      const supabase = createClient();
      try {
        // Already rendered → just sign it.
        if (style.status === "ready" && style.preview_path) {
          const { data } = await supabase.storage
            .from("user-media")
            .createSignedUrl(style.preview_path, 3600);
          if (data?.signedUrl) setPreviews((p) => ({ ...p, [style.id]: data.signedUrl }));
          return;
        }
        if (!silent) setPreviewLoading(true);
        const res = await fetch("/api/hair/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ styleId: style.id }),
        });
        const json = await res.json();
        if (json.url) {
          setPreviews((p) => ({ ...p, [style.id]: json.url }));
          setStyles((prev) =>
            prev.map((s) => (s.id === style.id ? { ...s, status: "ready" } : s)),
          );
        } else if (!silent) {
          setError("Couldn't render that style — try again.");
        }
      } catch {
        if (!silent) setError("Couldn't render that style — try again.");
      } finally {
        inFlight.current.delete(style.id);
        if (!silent) setPreviewLoading(false);
      }
    },
    [previews],
  );

  // Generate the preview whenever the selection changes (with the spinner).
  useEffect(() => {
    if (mode !== "results" || !selectedId) return;
    const style = styles.find((s) => s.id === selectedId);
    if (style) ensurePreview(style);
    setShowFull(false);
  }, [mode, selectedId, styles, ensurePreview]);

  // Pre-generate the rest in the background so switching styles feels instant.
  useEffect(() => {
    if (mode !== "results") return;
    let cancelled = false;
    (async () => {
      for (const s of styles) {
        if (cancelled) return;
        // one at a time to avoid hammering the image API
        await ensurePreview(s, true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, styles, ensurePreview]);

  async function submit() {
    setError(null);
    setAnalyzing(true);
    try {
      const res = await fetch("/api/hair/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionnaire: answers }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error === "no-scan" ? "Take a scan first." : "Analysis failed — try again.");
        setAnalyzing(false);
        return;
      }
      setStyles(json.styles);
      setRead({ face_shape: json.read.face_shape, hair_type: json.read.hair_type });
      setSelectedId(json.styles[0]?.id ?? null);
      setMode("results");
    } catch {
      setError("Analysis failed — try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function save(style: Style) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("saved_looks").insert({
      user_id: user.id,
      kind: "hair",
      ref_id: style.id,
      title: style.name,
      image_path: style.preview_path,
    });
    setSavedIds((s) => new Set(s).add(style.id));
  }

  const allAnswered = HAIR_QUESTIONS.every((q) => answers[q.id]);
  const selected = styles.find((s) => s.id === selectedId) ?? null;

  // ============================ states ============================
  if (mode === "loading") {
    return <p className="font-mono text-[13px] text-stone">Loading…</p>;
  }

  if (mode === "need-scan") {
    return (
      <div className="max-w-[520px]">
        <p className="eyebrow mb-4">hair</p>
        <h1 className="font-display text-[clamp(32px,5vw,48px)] font-bold leading-[0.95] tracking-[-0.04em] mb-4">
          {HAIR_COPY.needScanTitle}
        </h1>
        <p className="text-graphite text-[clamp(16px,2vw,18px)] leading-relaxed max-w-[42ch] mb-8">
          {HAIR_COPY.needScanBody}
        </p>
        <Button href="/scan" size="lg">
          {HAIR_COPY.needScanCta}
        </Button>
      </div>
    );
  }

  if (mode === "questionnaire") {
    return (
      <div className="max-w-[640px]">
        <p className="eyebrow mb-4">{HAIR_COPY.introEyebrow}</p>
        <h1 className="font-display text-[clamp(32px,5vw,48px)] font-bold leading-[0.95] tracking-[-0.04em] mb-3">
          {HAIR_COPY.introTitle}
        </h1>
        <p className="text-graphite text-[clamp(15px,1.8vw,17px)] leading-relaxed max-w-[44ch] mb-8">
          {HAIR_COPY.introBody}
        </p>

        <div className="grid gap-6">
          {HAIR_QUESTIONS.map((q) => (
            <div key={q.id}>
              <p className="font-mono text-[12px] tracking-[0.14em] uppercase text-stone mb-3">
                {q.label}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {q.options.map((o) => {
                  const active = answers[q.id] === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.value }))}
                      className={`rounded-full border px-4 py-2 text-[14px] transition-colors ${
                        active
                          ? "border-ink bg-ink text-bone"
                          : "border-[var(--ink-12)] text-graphite hover:border-bronze hover:text-ink"
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="mt-6 text-[14px] text-bronze">{error}</p>}

        <div className="mt-8">
          <Button onClick={submit} size="lg" disabled={!allAnswered || analyzing}>
            {analyzing ? HAIR_COPY.analyzing : HAIR_COPY.analyze}
          </Button>
        </div>
      </div>
    );
  }

  // ============================ results ============================
  return (
    <>
      <header className="mb-[clamp(20px,3vh,32px)]">
        <Link
          href="/dashboard"
          className="group mb-5 inline-flex items-center gap-2.5 rounded-full border border-[var(--ink-12)] bg-cloud py-2 pl-2 pr-4 font-mono text-[12px] uppercase tracking-[0.12em] text-graphite transition-colors hover:border-bronze hover:text-ink"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-ink text-bone transition-transform group-hover:-translate-x-0.5">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </span>
          Dashboard
        </Link>
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="eyebrow mb-3">{HAIR_COPY.resultsEyebrow}</p>
            <h1 className="font-display text-[clamp(30px,4.5vw,46px)] font-bold leading-[0.95] tracking-[-0.04em]">
              {HAIR_COPY.resultsTitle}
            </h1>
          </div>
          <div className="hidden sm:flex gap-8 pt-2 text-right">
            {read.face_shape && (
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-stone mb-1.5">
                  Face shape
                </p>
                <p className="font-display text-[18px] tracking-[-0.02em] text-ink">
                  {read.face_shape}
                </p>
              </div>
            )}
            {read.hair_type && (
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-stone mb-1.5">
                  Hair
                </p>
                <p className="font-display text-[18px] tracking-[-0.02em] text-ink">
                  {read.hair_type}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-[clamp(16px,2.5vw,32px)] lg:grid-cols-2">
        {/* Preview */}
        <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] bg-[#2C2B27]">
          {selected && previews[selected.id] ? (
            originalUrl ? (
              <div
                ref={containerRef}
                className="relative h-full w-full select-none overflow-hidden cursor-col-resize"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                {/* Underlay: Suggested / Preview */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previews[selected.id]}
                  alt={`${selected.name} previewed on you`}
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                />

                {/* Overlay: Original */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={originalUrl}
                  alt="Original hair"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    clipPath: `polygon(0 0, ${sliderVal}% 0, ${sliderVal}% 100%, 0 100%)`,
                  }}
                  draggable={false}
                />

                {/* Divider Line */}
                <div
                  className="absolute inset-y-0 z-20 w-[3px] bg-[#F4F2EC] -translate-x-1/2 pointer-events-none"
                  style={{ left: `${sliderVal}%` }}
                />

                {/* Corner indicator */}
                <span className="absolute bottom-4 left-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#F4F2EC]/85 [text-shadow:0_1px_10px_rgba(0,0,0,0.6)] z-30">
                  <span className="h-1.5 w-1.5 rounded-full bg-bronze" />
                  {HAIR_COPY.previewedOnYou}
                </span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previews[selected.id]}
                alt={`${selected.name} previewed on you`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              {previewLoading ? (
                <div className="flex flex-col items-center gap-3 text-center">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-bronze" />
                  <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#F4F2EC]/70">
                    {HAIR_COPY.generating}
                  </p>
                </div>
              ) : (
                <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#F4F2EC]/40">
                  select a style
                </p>
              )}
            </div>
          )}
          {selected && previews[selected.id] && !originalUrl && (
            <span className="absolute bottom-4 left-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#F4F2EC]/85 [text-shadow:0_1px_10px_rgba(0,0,0,0.6)]">
              <span className="h-1.5 w-1.5 rounded-full bg-bronze" />
              {HAIR_COPY.previewedOnYou}
            </span>
          )}
        </div>

        {/* Detail */}
        {selected && (
          <div className="flex flex-col">
            <h2 className="font-display text-[clamp(24px,3vw,34px)] font-bold tracking-[-0.03em] text-ink mb-3">
              {selected.name}
            </h2>
            <p className="text-graphite text-[clamp(15px,1.7vw,18px)] leading-relaxed mb-6">
              {selected.rationale}
            </p>

            <div className="rounded-[16px] border border-[var(--ink-08)] bg-cloud p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-stone mb-2.5">
                {showFull ? HAIR_COPY.fullBrief.toLowerCase() : HAIR_COPY.quickBrief}
              </p>
              <p className="text-ink text-[15px] leading-relaxed">
                {showFull ? selected.full_brief : selected.brief}
              </p>
            </div>

            <div className="mt-auto grid gap-3 pt-8">
              <Button
                onClick={() => save(selected)}
                disabled={savedIds.has(selected.id)}
                className="w-full justify-center"
                size="lg"
              >
                {savedIds.has(selected.id) ? HAIR_COPY.saved : HAIR_COPY.save}
              </Button>
              <button
                type="button"
                onClick={() => setShowFull((v) => !v)}
                className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--ink-12)] py-3.5 font-display text-[15px] font-medium text-ink transition-colors hover:border-bronze cursor-pointer"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 shrink-0 transition-transform duration-300"
                  aria-hidden="true"
                >
                  {showFull ? (
                    <>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <line x1="7" y1="8" x2="17" y2="8" />
                      <line x1="7" y1="12" x2="17" y2="12" />
                      <line x1="7" y1="16" x2="13" y2="16" />
                    </>
                  ) : (
                    <>
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <line x1="10" y1="9" x2="8" y2="9" />
                    </>
                  )}
                </svg>
                {showFull ? "Show quick brief" : HAIR_COPY.fullBrief}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-5 text-[14px] text-bronze">{error}</p>}

      {/* Other styles */}
      <p className="eyebrow mt-[clamp(28px,4vh,44px)] mb-5">{HAIR_COPY.otherStyles}</p>
      <div className="grid grid-cols-2 gap-[clamp(12px,1.4vw,18px)] lg:grid-cols-4">
        {styles.map((s) => {
          const active = s.id === selectedId;
          const hasImg = !!previews[s.id];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedId(s.id)}
              className={`flex flex-col overflow-hidden rounded-[16px] border text-left transition-colors ${
                active ? "border-bronze" : "border-[var(--ink-08)] hover:border-[rgba(176,122,60,0.5)]"
              }`}
            >
              {hasImg ? (
                <>
                  <div className="relative aspect-square bg-[#2C2B27]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previews[s.id]}
                      alt={s.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <p
                    className={`px-3.5 py-3 font-display text-[15px] tracking-[-0.01em] ${
                      active ? "font-bold text-ink" : "font-medium text-graphite"
                    }`}
                  >
                    {s.name}
                  </p>
                </>
              ) : (
                <div className="flex min-h-[190px] flex-1 flex-col gap-2 bg-[#2C2B27] p-[18px] text-left">
                  <p className="font-display text-[16px] font-bold leading-tight tracking-[-0.02em] text-[#F4F2EC]">
                    {s.name}
                  </p>
                  <p className="font-body text-[12.5px] leading-relaxed text-[#F4F2EC]/55 line-clamp-6">
                    {s.rationale}
                  </p>
                  {active && previewLoading && (
                    <span className="mt-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-bronze">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-bronze" />
                      rendering on you
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
