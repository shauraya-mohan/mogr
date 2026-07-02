"use client";

import type { GarmentColor } from "@/lib/wardrobe/content";

/**
 * One closet garment — real Photoroom cutout on the Cloud surface, name +
 * detected colours, and a hover overlay with key tags + remove.
 */
export default function GarmentCard({
  name,
  cutoutUrl,
  colors,
  formality,
  fit,
  riseDelay,
  onRemove,
}: {
  name: string;
  cutoutUrl: string | null;
  colors: GarmentColor[];
  formality?: string;
  fit?: string;
  riseDelay: number;
  onRemove: () => void;
}) {
  return (
    <article className="garment-card rise" tabIndex={0} data-rise-delay={riseDelay.toFixed(2)}>
      <div className="garment-card__stage">
        {cutoutUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="cutout" src={cutoutUrl} alt={name} />
        ) : (
          <div className="garment-ph">
            <span className="garment-ph__label">no image</span>
          </div>
        )}
      </div>
      <div className="garment-card__foot">
        <p className="garment-card__name">{name}</p>
        <div className="swatches">
          {colors.map((c, i) => (
            <span key={i} className="swatch-dot" style={{ background: c.hex }} title={c.name} />
          ))}
        </div>
      </div>

      <div className="garment-card__overlay">
        <div className="overlay-tags">
          {formality && formality !== "unclear" && <span className="tag-mini">{formality}</span>}
          {fit && fit !== "unclear" && <span className="tag-mini">{fit}</span>}
        </div>
        <div className="overlay-actions">
          <button className="icon-btn" type="button" aria-label={`Remove ${name}`} onClick={onRemove}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7h16" />
              <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
              <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
