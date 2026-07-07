"use client";

import { useEffect, useState, type CSSProperties } from "react";
import type { OutfitSlot } from "@/lib/wardrobe/content";
import {
  SLOT_ORDER,
  SLOT_LABEL,
  SLOT_TO_CATEGORY,
  THEMES,
  normalizeOccasion,
  type ClosetPickerItem,
  type LookPiece,
} from "@/lib/wardrobe/looks";
import { FILTER_ICONS } from "@/components/wardrobe/categoryIcons";

export interface LookFormInitial {
  name: string;
  occasion: string;
  rationale?: string;
  pieces: LookPiece[];
}

export interface LookFormResult {
  name: string;
  occasion: string;
  rationale?: string;
  pieces: LookPiece[];
}

/** Centred save/edit look dialog: slot rail + closet picker for the active slot + occasion. */
export default function LookFormModal({
  mode,
  initial,
  closet,
  saving = false,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  initial: LookFormInitial;
  closet: Record<OutfitSlot, ClosetPickerItem[]>;
  saving?: boolean;
  onClose: () => void;
  onSave: (result: LookFormResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial.name);
  const [occasion, setOccasion] = useState(normalizeOccasion(initial.occasion));
  const [draft, setDraft] = useState<Partial<Record<OutfitSlot, LookPiece>>>(() => {
    const d: Partial<Record<OutfitSlot, LookPiece>> = {};
    initial.pieces.forEach((p) => (d[p.slot] = p));
    return d;
  });
  const [activeSlot, setActiveSlot] = useState<OutfitSlot>(
    initial.pieces[0]?.slot ?? "top"
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  function close() {
    setOpen(false);
    setTimeout(onClose, 400);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectItem(item: ClosetPickerItem) {
    setError(null);
    setDraft((d) => {
      if (d[activeSlot]?.itemId === item.itemId) {
        const next = { ...d };
        delete next[activeSlot];
        return next;
      }
      return {
        ...d,
        [activeSlot]: { slot: activeSlot, name: item.name, tint: item.tint, cutoutUrl: item.cutoutUrl, itemId: item.itemId },
      };
    });
  }

  function save() {
    const pieces = SLOT_ORDER.map((s) => draft[s]).filter((p): p is LookPiece => Boolean(p));
    if (!pieces.length) {
      setError("Add at least one piece to save this look.");
      return;
    }
    onSave({ name: name.trim() || "Untitled look", occasion, rationale: initial.rationale, pieces });
  }

  const current = draft[activeSlot];
  const items = closet[activeSlot] ?? [];
  const slotLabel = SLOT_LABEL[activeSlot].toLowerCase();

  return (
    <div className={`lookform-overlay${open ? " is-mounted is-open" : " is-mounted"}`} role="dialog" aria-modal="true" aria-label={mode === "edit" ? "Edit look" : "Save look"}>
      <div className="lookform-backdrop" onClick={close} />
      <div className="lookform">
        <div className="lookform__head">
          <p className="eyebrow">{mode === "edit" ? "edit look" : "compose"}</p>
          <button className="sheet-close" type="button" onClick={close} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <input
          className="lookform__name"
          type="text"
          placeholder="Name this look"
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Look name"
        />

        <div className="lookform__body">
          <div className="lookform__rail">
            {SLOT_ORDER.map((slot) => {
              const filled = draft[slot];
              const Icon = FILTER_ICONS[SLOT_TO_CATEGORY[slot]];
              return (
                <button
                  key={slot}
                  type="button"
                  className={`lookform__slot${filled ? " is-filled" : ""}${activeSlot === slot ? " is-active" : ""}`}
                  aria-label={SLOT_LABEL[slot]}
                  aria-pressed={activeSlot === slot}
                  onClick={() => setActiveSlot(slot)}
                >
                  {Icon && <Icon />}
                  {filled && <span className="lookform__slot-dot" style={{ "--tint": filled.tint } as CSSProperties} />}
                </button>
              );
            })}
          </div>

          <div className="lookform__panel">
            <p className="lookform__panel-label">{SLOT_LABEL[activeSlot]}</p>

            <div className={`lookform__hero${current ? "" : " lookform__hero--empty"}`}>
              <div className="lookform__hero-art" style={current ? ({ "--tint": current.tint } as CSSProperties) : undefined}>
                {current ? (
                  current.cutoutUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={current.cutoutUrl} alt={current.name} />
                  ) : null
                ) : (
                  (() => {
                    const Icon = FILTER_ICONS[SLOT_TO_CATEGORY[activeSlot]];
                    return Icon ? <Icon /> : null;
                  })()
                )}
              </div>
              <div className="lookform__hero-copy">
                <p className="lookform__hero-name">{current ? current.name : `No ${slotLabel} yet`}</p>
                <p className="lookform__hero-hint">{current ? "Tap below to change" : "Pick one below"}</p>
              </div>
            </div>

            <p className="lookform__grid-label">Your {slotLabel}</p>
            {items.length > 0 ? (
              <div className="lookform__grid">
                {items.map((item) => (
                  <button
                    key={item.itemId}
                    type="button"
                    className={`lookform__item${current?.itemId === item.itemId ? " is-selected" : ""}`}
                    onClick={() => selectItem(item)}
                  >
                    <span className="lookform__item-art" style={{ "--tint": item.tint } as CSSProperties}>
                      {item.cutoutUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.cutoutUrl} alt={item.name} />
                      )}
                    </span>
                    <span className="lookform__item-name">{item.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="lookform__grid-empty">No {slotLabel} in your closet yet.</p>
            )}
          </div>
        </div>

        <div className="field">
          <span className="field__label">Saved for</span>
          <div className="occasion-select">
            {Object.entries(THEMES).map(([key, th]) => (
              <button
                key={key}
                type="button"
                className={`chip is-occasion${occasion === key ? " is-active" : ""}`}
                onClick={() => setOccasion(key)}
              >
                {th.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="lookform__error">{error}</p>}

        <div className="sheet-foot">
          <button className="btn btn-secondary btn-lg" type="button" onClick={close}>
            Cancel
            <svg className="btn__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <button className="btn btn-bronze btn-lg" type="button" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save look"}
            <svg className="btn__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
