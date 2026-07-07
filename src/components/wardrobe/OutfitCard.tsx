"use client";

import { useEffect, useState } from "react";
import type { Outfit, OutfitSlot } from "@/lib/wardrobe/content";
import Flatlay from "@/components/wardrobe/Flatlay";
import { AccessoryIcon } from "@/components/wardrobe/categoryIcons";
import LookFormModal, { type LookFormResult } from "@/components/wardrobe/looks/LookFormModal";
import { normalizeOccasion, type ClosetPickerItem } from "@/lib/wardrobe/looks";
import { createLook } from "@/lib/wardrobe/looksStore";

type View = "flat" | "accessories";

export default function OutfitCard({
  outfit,
  closet,
}: {
  outfit: Outfit;
  closet: Record<OutfitSlot, ClosetPickerItem[]>;
}) {
  const [view, setView] = useState<View>("flat");
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!formOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [formOpen]);

  async function handleSaveLook(result: LookFormResult) {
    setSaving(true);
    try {
      await createLook(result);
      setSaved(true);
      setFormOpen(false);
    } catch (e) {
      console.error("[outfit] save look failed:", e);
    } finally {
      setSaving(false);
    }
  }

  const mainPieces = outfit.pieces.filter((p) => p.slot !== "accessory");
  const accessoryPieces = outfit.pieces.filter((p) => p.slot === "accessory");

  return (
    <article className="outfit-card rise">
      {/* visual column: view toggle (flat-lay ↔ accessories) + stage */}
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
            className={`view-btn${view === "accessories" ? " is-active" : ""}`}
            aria-label="Accessories view"
            role="tab"
            aria-selected={view === "accessories"}
            onClick={() => setView("accessories")}
          >
            <AccessoryIcon />
            Accessories
          </button>
        </div>
        <div className={`view-panel${view === "flat" ? " is-active" : ""}`}>
          <Flatlay pieces={mainPieces} />
        </div>
        <div className={`view-panel${view === "accessories" ? " is-active" : ""}`}>
          {accessoryPieces.length > 0 ? (
            <Flatlay pieces={accessoryPieces} />
          ) : (
            <div className="accessories-empty">No accessories suggested for this look.</div>
          )}
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
          <button
            type="button"
            className={`btn${saved ? " btn-secondary" : ""}`}
            onClick={() => setFormOpen(true)}
            disabled={saved}
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
        </div>
      </div>

      {formOpen && (
        <LookFormModal
          mode="create"
          initial={{
            name: outfit.title,
            occasion: normalizeOccasion(outfit.occasion),
            rationale: outfit.rationale,
            pieces: outfit.pieces,
          }}
          closet={closet}
          saving={saving}
          onClose={() => setFormOpen(false)}
          onSave={handleSaveLook}
        />
      )}
    </article>
  );
}

