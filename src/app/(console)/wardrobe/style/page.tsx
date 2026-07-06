"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  OCCASIONS,
  STYLING_STATUS,
  type Outfit,
} from "@/lib/wardrobe/content";
import { useReveal } from "@/lib/wardrobe/useReveal";
import OutfitCard from "@/components/wardrobe/OutfitCard";
import ColourDrawer, { type DrawerPalette } from "@/components/wardrobe/ColourDrawer";
import UndertoneQuiz from "@/components/wardrobe/UndertoneQuiz";
import { createClient } from "@/lib/supabase/client";

type Mode = "loading" | "quiz" | "input" | "styling" | "results";

/* ── occasion chip icons ─────────────────────────────────────── */
const OCCASION_ICONS: Record<string, React.ReactNode> = {
  "Casual": (
    <svg className="chip__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9h10v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9z"/>
      <path d="M16 12h1.5a2 2 0 0 1 0 4H16"/>
      <path d="M9.5 6c0-1.5 2-1.5 2-3M12.5 6c0-1.5 2-1.5 2-3"/>
    </svg>
  ),
  "Work": (
    <svg className="chip__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="8" width="20" height="13" rx="2"/>
      <path d="M16 8V6a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
      <path d="M2 13h20"/>
    </svg>
  ),
  "Smart casual": (
    <svg className="chip__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3L3 7l2 1.5V20h14V8.5L21 7l-3-4"/>
      <path d="M9 3c0 2.5 1.2 3.5 3 3.5s3-1 3-3.5"/>
    </svg>
  ),
  "Going out": (
    <svg className="chip__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16L12 14 4 4z"/>
      <line x1="12" y1="14" x2="12" y2="20"/>
      <line x1="8" y1="20" x2="16" y2="20"/>
    </svg>
  ),
  "Date": (
    <svg className="chip__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  "Formal": (
    <svg className="chip__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l2.4 7.4L22 12l-7.6 2.6L12 22l-2.4-7.4L2 12l7.6-2.6z"/>
    </svg>
  ),
  "Athletic": (
    <svg className="chip__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 2L4 14h8l-1 8 9-12h-8z"/>
    </svg>
  ),
};

function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3a9 9 0 0 0 0 18 2.4 2.4 0 0 0 2.4-2.4c0-.63-.24-1.2-.63-1.63-.38-.42-.62-.98-.62-1.6a2.4 2.4 0 0 1 2.4-2.37H18a3 3 0 0 0 3-3C21 6.48 16.97 3 12 3z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.6" r="1" fill="currentColor" stroke="none" />
      <circle cx="16.4" cy="10.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function WardrobeStylePage() {
  const [mode, setMode] = useState<Mode>("loading");
  const [occasion, setOccasion] = useState<string>("Casual");
  const [prompt, setPrompt] = useState("");
  const [statusIdx, setStatusIdx] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [palette, setPalette] = useState<DrawerPalette | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [avoidItemIds, setAvoidItemIds] = useState<string[]>([]);
  const [hybridMode, setHybridMode] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  useReveal(contentRef, [mode]);

  async function fetchPalette() {
    const res = await fetch("/api/wardrobe/palette");
    if (!res.ok) return;
    const data = await res.json() as DrawerPalette;
    setPalette(data);
  }

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMode("input"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("undertone")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.undertone) {
        setMode("input");
        fetchPalette();
      } else {
        setMode("quiz");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStyleMe = useCallback(async (extraAvoidIds?: string[]) => {
    const avoid = [...avoidItemIds, ...(extraAvoidIds ?? [])];
    if (extraAvoidIds?.length) setAvoidItemIds(avoid);

    setMode("styling");
    setAnalyzeError(null);
    setStatusIdx(0);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = reduced ? 350 : 1050;
    const minWait = reduced ? 900 : 3400;

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < STYLING_STATUS.length; i++) {
      timers.push(setTimeout(() => setStatusIdx(i), step * i));
    }

    try {
      const [res] = await Promise.all([
        fetch("/api/wardrobe/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chips: [occasion], prompt, mode: hybridMode ? "hybrid" : "closet_only", avoidItemIds: avoid }),
        }).then(r => r.json()),
        new Promise<void>(resolve => setTimeout(resolve, minWait)),
      ]);

      timers.forEach(clearTimeout);

      if (Array.isArray(res.outfits) && res.outfits.length > 0) {
        setOutfits(res.outfits);
        setMode("results");
      } else {
        setAnalyzeError(res.error === "stylist-failed"
          ? "Couldn't build looks. Try a different occasion."
          : "No items in your closet match that occasion yet.");
        setMode("input");
      }
    } catch {
      timers.forEach(clearTimeout);
      setAnalyzeError("Something went wrong. Try again.");
      setMode("input");
    }
  }, [avoidItemIds, occasion, prompt, hybridMode]);

  const handleTryAgain = useCallback(() => {
    const shownIds = outfits.flatMap(o => o.itemIds);
    handleStyleMe(shownIds);
  }, [outfits, handleStyleMe]);

  const resultsTitle = occasion === "Casual" ? "Understated" : occasion;

  if (mode === "loading") return null;

  if (mode === "quiz") {
    return (
      <UndertoneQuiz
        onComplete={() => {
          setMode("input");
          fetchPalette();
        }}
      />
    );
  }

  return (
    <div className="style-layout" ref={contentRef}>
      {/* ===== Occasion input ===== */}
      {mode === "input" && (
        <section className="style-hero">
          <p className="eyebrow style-eyebrow rise">style me</p>
          <h1 className="page-title rise" data-rise-delay="0.05">
            What&apos;s the occasion<span className="dot">.</span>
          </h1>

          {analyzeError && (
            <p className="style-error rise" data-rise-delay="0.08" role="alert">
              {analyzeError}
            </p>
          )}

          <div className="occasion-chips rise" data-rise-delay="0.1" role="listbox" aria-label="Occasion">
            {OCCASIONS.map((o) => (
              <button
                key={o}
                type="button"
                className={`chip${occasion === o ? " is-active" : ""}`}
                role="option"
                aria-selected={occasion === o}
                onClick={() => setOccasion(o)}
              >
                {OCCASION_ICONS[o]}
                {o}
              </button>
            ))}
          </div>

          <textarea
            className="prompt-field rise"
            data-rise-delay="0.12"
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="…or describe it: 'dinner date, cooler evening, keep it understated'"
          />

          {/* ── Mode selector ── */}
          <div className="mode-selector rise" data-rise-delay="0.13" role="group" aria-label="Outfit source">
            <button
              type="button"
              className={`mode-option${!hybridMode ? " is-active" : ""}`}
              onClick={() => setHybridMode(false)}
            >
              <svg className="mode-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="3" width="6" height="8" rx="1.5"/>
                <rect x="10" y="3" width="6" height="8" rx="1.5"/>
                <rect x="18" y="3" width="4" height="8" rx="1.5"/>
                <rect x="2" y="13" width="20" height="8" rx="1.5"/>
              </svg>
              <span>My closet only</span>
            </button>
            <button
              type="button"
              className={`mode-option${hybridMode ? " is-active" : ""}`}
              onClick={() => setHybridMode(true)}
            >
              <svg className="mode-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"/>
                <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill="currentColor" stroke="none"/>
              </svg>
              <span>Open to suggestions</span>
            </button>
          </div>

          <div className="style-actions rise" data-rise-delay="0.15">
            <button
              className="btn btn-lg btn-bronze style-cta"
              type="button"
              onClick={() => handleStyleMe()}
            >
              <svg className="btn__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3l1.9 4.8 4.8 1.9-4.8 1.9L12 16.4l-1.9-4.8L5.3 9.7l4.8-1.9z" />
                <path d="M18.4 14.6l.75 1.9 1.9.75-1.9.75-.75 1.9-.75-1.9-1.9-.75 1.9-.75z" />
              </svg>
              Style me
            </button>
            <button
              className="colours-trigger"
              type="button"
              aria-label="View your colours"
              onClick={() => setDrawerOpen(true)}
            >
              <PaletteIcon />
            </button>
          </div>
          <p className="style-helper rise" data-rise-delay="0.18">
            Looks built from your closet, matched to your colouring.
          </p>
        </section>
      )}

      {/* ===== Styling loader ===== */}
      {mode === "styling" && (
        <section className="styling-state">
          <p className="scan-step-label" style={{ justifyContent: "center" }}>
            Styling
          </p>
          <div className="status-lines">
            {STYLING_STATUS.map((line, i) => (
              <p key={i} className={`status-line${i === statusIdx ? " is-current" : ""}`}>
                {line}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* ===== Results ===== */}
      {mode === "results" && (
        <section className="results">
          <div className="results-head">
            <div>
              <p className="eyebrow style-eyebrow">your looks</p>
              <h2 className="page-title" style={{ fontSize: "clamp(30px,4vw,44px)" }}>
                {resultsTitle}
                <span className="dot">.</span>
              </h2>
            </div>
            <div className="results-head__actions">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleTryAgain}
              >
                <svg className="btn__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                Try again
              </button>
              <button
                className="colours-trigger"
                type="button"
                aria-label="View your colours"
                onClick={() => setDrawerOpen(true)}
              >
                <PaletteIcon />
              </button>
              <button className="text-link" type="button" onClick={() => { setMode("input"); setAvoidItemIds([]); }}>
                change occasion
              </button>
            </div>
          </div>
          <div className="outfit-list">
            {outfits.map((o) => (
              <OutfitCard key={o.title} outfit={o} />
            ))}
          </div>
        </section>
      )}

      <ColourDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} palette={palette} />
    </div>
  );
}
