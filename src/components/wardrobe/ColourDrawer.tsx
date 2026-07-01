"use client";

import { useEffect } from "react";
import { CSSProperties } from "react";
import { CAUTION, FLATTERING, type Swatch } from "@/lib/wardrobe/content";

function SwatchTile({ sw }: { sw: Swatch }) {
  return (
    <div className="swatch" title={sw.name}>
      <span className="swatch__chip" style={{ background: sw.hex }} />
      <span className="swatch__hex">{sw.hex.toUpperCase()}</span>
    </div>
  );
}

/**
 * "Your colours" slide-over. TODO(backend): the palette is deterministic —
 * GET /api/wardrobe/palette (undertone + hair tone → lookup table). Here it's
 * the prototype's placeholder set.
 */
export default function ColourDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
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
          <h3>
            Warm, earthy, low-contrast<span className="dot">.</span>
          </h3>
          <p className="panel-sub">
            Built from your skin undertone and hair tone. Lean into these;
            they&apos;ll do the work for you.
          </p>

          <div className="swatch-strip">
            {FLATTERING.map((s) => (
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
            {CAUTION.map((s) => (
              <SwatchTile key={s.hex} sw={s} />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
