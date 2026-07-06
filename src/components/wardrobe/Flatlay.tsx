import type { CSSProperties } from "react";
import type { OutfitPiece } from "@/lib/wardrobe/content";

/**
 * Flat-lay: the outfit's constituent cutouts composed as a neat grid.
 * When a piece has a cutoutUrl (Photoroom ghost-mannequin image), that image
 * is rendered. Otherwise falls back to the tinted colour placeholder.
 */
export default function Flatlay({ pieces }: { pieces: OutfitPiece[] }) {
  return (
    <div className="flatlay">
      {pieces.map((p, i) => (
        <div className="flatlay__cell" key={i}>
          {p.cutoutUrl ? (
            <div className="flatlay__cutout" style={{ "--tint": p.tint } as CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.cutoutUrl}
                alt={p.name}
                className="flatlay__img"
                loading="lazy"
                draggable={false}
              />
              <span className="flatlay__name">{p.name}</span>
            </div>
          ) : (
            <div className="garment-ph" style={{ "--tint": p.tint } as CSSProperties}>
              <span className="garment-ph__label">{p.name}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
