import type { CSSProperties } from "react";
import type { OutfitPiece } from "@/lib/wardrobe/content";

/**
 * Flat-lay: the outfit's constituent cutouts composed as a neat grid (NOT on
 * a body). TODO(backend) IMAGE SLOT: replace each .garment-ph with the owned
 * item's Photoroom cutout (signed URL).
 */
export default function Flatlay({ pieces }: { pieces: OutfitPiece[] }) {
  return (
    <div className="flatlay">
      {pieces.map((p, i) => (
        <div className="flatlay__cell" key={i}>
          <div className="garment-ph" style={{ "--tint": p.tint } as CSSProperties}>
            <span className="garment-ph__label">{p.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
