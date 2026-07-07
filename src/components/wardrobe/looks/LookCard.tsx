import type { CSSProperties } from "react";
import type { SavedLook } from "@/lib/wardrobe/looks";
import { themeFor } from "@/lib/wardrobe/looks";

/** Saved-looks grid card: a 2×2 flat-lay preview + name + occasion tag. */
export default function LookCard({
  look,
  riseDelay,
  onOpen,
}: {
  look: SavedLook;
  riseDelay: number;
  onOpen: () => void;
}) {
  const th = themeFor(look.occasion);
  const cells = Array.from({ length: 4 }, (_, i) => look.pieces[i] ?? null);

  return (
    <button
      type="button"
      className="look-card rise"
      data-rise-delay={riseDelay}
      style={{ "--accent": th.accent } as CSSProperties}
      aria-label={`Open ${look.name}`}
      onClick={onOpen}
    >
      <div className="look-card__preview">
        {cells.map((piece, i) =>
          piece ? (
            <div className="look-card__cell" key={i}>
              {piece.cutoutUrl ? (
                <div className="look-photo" style={{ "--tint": piece.tint } as CSSProperties}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="look-photo__img" src={piece.cutoutUrl} alt={piece.name} loading="lazy" draggable={false} />
                </div>
              ) : (
                <div className="look-ph" style={{ "--tint": piece.tint } as CSSProperties}>
                  <span className="look-ph__label">{piece.name}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="look-card__cell look-card__cell--empty" key={i} />
          )
        )}
        <div className="look-card__hover">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          View
        </div>
      </div>
      <div className="look-card__foot">
        <p className="look-card__name">{look.name}</p>
        <span className="look-tag">{th.label}</span>
      </div>
    </button>
  );
}
