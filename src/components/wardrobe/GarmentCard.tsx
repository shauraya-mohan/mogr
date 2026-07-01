"use client";

import type { CSSProperties } from "react";
import { pieceLabel, type WardrobeItemView } from "@/lib/wardrobe/content";

/**
 * One closet garment. The stage shows a hatched placeholder tinted by the
 * dominant colour. TODO(backend) IMAGE SLOT: replace .garment-ph with the
 * item's Photoroom cutout <img src={signedUrl}>. Edit/remove map to
 * PATCH/DELETE /api/wardrobe/items/{id}.
 */
export default function GarmentCard({
  item,
  riseDelay,
  onRemove,
}: {
  item: WardrobeItemView;
  riseDelay: number;
  onRemove: () => void;
}) {
  return (
    <article
      className="garment-card rise"
      data-cat={item.cat}
      tabIndex={0}
      data-rise-delay={riseDelay.toFixed(2)}
    >
      <div className="garment-card__stage">
        <div className="garment-ph" style={{ "--tint": item.colors[0] } as CSSProperties}>
          <span className="garment-ph__label">
            cutout
            <br />
            {pieceLabel(item.name)}
          </span>
        </div>
      </div>
      <div className="garment-card__foot">
        <p className="garment-card__name">{item.name}</p>
        <div className="swatches">
          {item.colors.map((c, i) => (
            <span key={i} className="swatch-dot" style={{ background: c }} />
          ))}
        </div>
      </div>

      {/* hover overlay: key tags + edit / remove */}
      <div className="garment-card__overlay">
        <div className="overlay-tags">
          <span className="tag-mini">{item.formality}</span>
          <span className="tag-mini">{item.fit}</span>
        </div>
        <div className="overlay-actions">
          <button className="icon-btn" type="button" aria-label={`Edit ${item.name}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
            </svg>
          </button>
          <button
            className="icon-btn"
            type="button"
            aria-label={`Remove ${item.name}`}
            onClick={onRemove}
          >
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
