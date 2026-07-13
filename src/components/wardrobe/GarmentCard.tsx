"use client";

import { useState } from "react";
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
  onEdit,
  onRemove,
}: {
  name: string;
  cutoutUrl: string | null;
  colors: GarmentColor[];
  formality?: string;
  fit?: string;
  riseDelay: number;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <article className="garment-card rise" tabIndex={0} data-rise-delay={riseDelay.toFixed(2)}>
      <div className="garment-card__stage">
        {cutoutUrl ? (
          <>
            {!loaded && <div className="skeleton" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={`cutout cutout--fade${loaded ? " is-loaded" : ""}`}
              src={cutoutUrl}
              alt={name}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
            />
          </>
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
          <button className="icon-btn" type="button" aria-label={`Edit ${name}`} onClick={onEdit}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
            </svg>
          </button>
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
