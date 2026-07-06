"use client";

import { useState } from "react";
import type { Outfit } from "@/lib/wardrobe/content";
import Flatlay from "@/components/wardrobe/Flatlay";
import Mannequin from "@/components/wardrobe/Mannequin";

type View = "flat" | "mannequin";

export default function OutfitCard({
  outfit,
  onTryAgain,
}: {
  outfit: Outfit;
  onTryAgain: () => void;
}) {
  const [view, setView] = useState<View>("flat");
  const [saved, setSaved] = useState(false);

  return (
    <article className="outfit-card rise">
      {/* visual column: view toggle (flat-lay ↔ mannequin) + stage */}
      <div className="outfit-visual">
        <div className="view-toggle" role="tablist" aria-label="Preview mode">
          <button
            type="button"
            className={`view-btn${view === "flat" ? " is-active" : ""}`}
            aria-label="Flat-lay view"
            role="tab"
            aria-selected={view === "flat"}
            onClick={() => setView("flat")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
              <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
              <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
              <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
            </svg>
            Pieces
          </button>
          <button
            type="button"
            className={`view-btn${view === "mannequin" ? " is-active" : ""}`}
            aria-label="Mannequin view"
            role="tab"
            aria-selected={view === "mannequin"}
            onClick={() => setView("mannequin")}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="6" r="3" />
              <path d="M12 9v5" />
              <path d="M6.5 11.5 12 10l5.5 1.5" />
              <path d="M9 21l1.2-7h3.6L15 21" />
            </svg>
            On you
          </button>
        </div>
        <div className={`view-panel${view === "flat" ? " is-active" : ""}`}>
          <Flatlay pieces={outfit.pieces} />
        </div>
        <div className={`view-panel${view === "mannequin" ? " is-active" : ""}`}>
          <Mannequin pieces={outfit.pieces} />
        </div>
      </div>

      <div className="outfit-body">
        <h3 className="outfit-title">{outfit.title}</h3>
        <p className="outfit-occasion">{outfit.occasion}</p>
        <p className="rationale">{outfit.rationale}</p>
        <p className="color-line">{outfit.colorRationale}</p>
        <p className="fit-note">{outfit.fitNote}</p>
        {outfit.outsideItems.length > 0 && (
          <p className="gap-note">
            <span>To complete this look: {outfit.outsideItems.join(", ")}.</span>
          </p>
        )}
        {outfit.gaps.map((g, i) => (
          <p key={i} className="gap-note">
            <span>{g}</span>
          </p>
        ))}
        <div className="outfit-actions">
          {/* Save look → confirm inline. TODO(backend): POST saved_looks {kind:"wardrobe"}. */}
          <button
            type="button"
            className={`btn${saved ? " btn-secondary" : ""}`}
            onClick={() => setSaved(true)}
          >
            {saved ? (
              <>
                <svg className="btn__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Saved
              </>
            ) : (
              <>
                <svg className="btn__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
                </svg>
                Save look
              </>
            )}
          </button>
          <button type="button" className="text-link" onClick={onTryAgain}>
            try again
          </button>
        </div>
      </div>
    </article>
  );
}
