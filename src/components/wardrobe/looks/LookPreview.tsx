"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { SavedLook } from "@/lib/wardrobe/looks";
import { themeFor, placePieces } from "@/lib/wardrobe/looks";

/** Layer 2 — full-bleed immersive preview of a saved look, themed by occasion. */
export default function LookPreview({
  look,
  onClose,
  onEdit,
  onDelete,
}: {
  look: SavedLook | null;
  onClose: () => void;
  onEdit: (look: SavedLook) => void;
  onDelete: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [settled, setSettled] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!look) return;
    lastFocus.current = document.activeElement as HTMLElement;
    setMounted(true);
    setSettled(false);
    setConfirmingDelete(false);
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setOpen(true))
    );
    const dropTimer = setTimeout(() => setSettled(true), 260);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(dropTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look?.id]);

  function close() {
    setOpen(false);
    setTimeout(() => {
      setMounted(false);
      onClose();
      lastFocus.current?.focus?.();
    }, 500);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key === "Tab") {
        const root = overlayRef.current;
        if (!root) return;
        const focusables = Array.from(
          root.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')
        ).filter((el) => el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted || !look) return null;

  const th = themeFor(look.occasion);
  const placed = placePieces(look.occasion, look.pieces);

  return (
    <div
      ref={overlayRef}
      className={`preview-overlay${mounted ? " is-mounted" : ""}${open ? " is-open" : ""}${!th.dark ? " scene-light" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Look preview"
      aria-hidden={!open}
    >
      <div
        className="scene"
        style={
          {
            "--scene-grad": th.grad,
            "--scene-light": th.light,
            "--accent": th.accent,
            "--glow-strength": th.glow,
            "--motif-strength": th.motifStrength,
            "--motif-ink": th.motifInk,
          } as CSSProperties
        }
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="scene__light" />
        <div className="scene__glow" />
        <div className="scene__motif" dangerouslySetInnerHTML={{ __html: th.motif }} />

        <div className="scene-top">
          <button className="scene-close" type="button" onClick={close} aria-label="Close preview">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="scene-stage">
          <div className="scene-stage__inner">
            <div className="surface-shadow" />
            {placed.map(({ piece, cx, cy, w, rot }, i) => (
              <div
                key={i}
                className={`piece${settled ? " settled" : ""}${piece.cutoutUrl ? " piece--photo" : ""}`}
                tabIndex={0}
                aria-label={piece.name}
                style={
                  {
                    "--tint": piece.tint,
                    "--cx": `${cx}%`,
                    "--cy": `${cy}%`,
                    "--w": `${w}%`,
                    "--rot": `${rot}deg`,
                    "--z": i + 1,
                    transitionDelay: settled ? `${0.22 + i * 0.08}s` : "0s",
                  } as CSSProperties
                }
              >
                <div className="piece__label">{piece.name}</div>
                <div className="piece__art">
                  {piece.cutoutUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="piece__art__img" src={piece.cutoutUrl} alt={piece.name} loading="lazy" draggable={false} />
                  ) : (
                    <span className="piece__ph">{piece.name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="scene-info">
          <p className="scene-info__eyebrow">saved look</p>
          <h2 className="scene-info__name">{look.name}</h2>
          <span className="scene-info__occasion">{th.label}</span>
          {look.rationale && <p className="scene-info__rationale">{look.rationale}</p>}
          <div className="scene-actions">
            <button className="btn btn-onscene" type="button" onClick={() => onEdit(look)}>
              <svg className="btn__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
              </svg>
              Edit
            </button>
            <button className="btn btn-ghost-scene" type="button" onClick={() => setConfirmingDelete(true)}>
              <svg className="btn__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 7h16" />
                <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
              </svg>
              Delete
            </button>
          </div>
          <div className={`delete-confirm${confirmingDelete ? " is-open" : ""}`}>
            <span>Delete this look?</span>
            <button className="confirm-yes" type="button" onClick={() => onDelete(look.id)}>
              Delete
            </button>
            <button className="confirm-no" type="button" onClick={() => setConfirmingDelete(false)}>
              Keep
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
