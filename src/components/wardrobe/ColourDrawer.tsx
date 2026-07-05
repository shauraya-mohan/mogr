"use client";

import { useEffect } from "react";
import { CSSProperties } from "react";
import type { Swatch } from "@/lib/wardrobe/palette";

export interface DrawerPalette {
  descriptor: string;
  worksForYou: Swatch[];
  caution: Swatch[];
  contrastGuidance?: string;
}

function SwatchTile({ sw }: { sw: Swatch }) {
  return (
    <div className="swatch" title={sw.name}>
      <span className="swatch__chip" style={{ background: sw.hex }} />
      <span className="swatch__hex">{sw.name}</span>
    </div>
  );
}

export default function ColourDrawer({
  open,
  onClose,
  palette,
}: {
  open: boolean;
  onClose: () => void;
  palette: DrawerPalette | null;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`colour-backdrop${open ? " is-open" : ""}`}
        onClick={onClose}
      />
      <aside
        className={`colour-drawer${open ? " is-open" : ""}`}
        aria-label="Your colours"
        aria-hidden={!open}
      >
        <button
          className="colour-drawer__close"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="colours-panel">
          <p className="eyebrow">your colours</p>

          {palette === null ? (
            /* Rendering state — shown while palette is being derived */
            <div style={{ paddingTop: 24 }}>
              <div
                className="skeleton"
                style={{
                  position: "relative", inset: "auto",
                  height: 28, borderRadius: 8, marginBottom: 10, width: "70%",
                }}
              />
              <div
                className="skeleton"
                style={{
                  position: "relative", inset: "auto",
                  height: 16, borderRadius: 6, marginBottom: 32, width: "90%",
                }}
              />
              <p
                className="panel-label"
                style={{ justifyContent: "center", marginBottom: 0 }}
              >
                <span
                  className="swatch-dot"
                  style={{ background: "var(--stone)", borderColor: "transparent", animation: "recPulse 2.6s ease infinite" } as CSSProperties}
                />
                Rendering your palette…
              </p>
            </div>
          ) : (
            <>
              <h3>
                {palette.descriptor}<span className="dot">.</span>
              </h3>
              <p className="panel-sub">
                {palette.contrastGuidance ?? "Built from your skin undertone and hair tone. Lean into these; they'll do the work for you."}
              </p>

              <div className="swatch-strip">
                {palette.worksForYou.map((s) => (
                  <SwatchTile key={s.hex} sw={s} />
                ))}
              </div>

              <div className="panel-divide" />

              <p className="panel-label">
                <span
                  className="swatch-dot"
                  style={{ background: "var(--stone)", borderColor: "transparent" } as CSSProperties}
                />
                approach with caution
              </p>
              <div className="swatch-strip">
                {palette.caution.map((s) => (
                  <SwatchTile key={s.hex} sw={s} />
                ))}
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
