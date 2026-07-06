import type { OutfitPiece, OutfitSlot } from "@/lib/wardrobe/content";

function pick(
  pieces: OutfitPiece[],
  slot: OutfitSlot,
  fallback: string | null
): string | null {
  const hit = pieces.find((p) => p.slot === slot);
  return hit ? hit.tint : fallback;
}

/**
 * Mannequin preview — when pieces have cutoutUrls, renders stacked cutout
 * images layered in the correct order (bottom → top → layer → footwear).
 * Falls back to the SVG colour figure when no images are available.
 */
export default function Mannequin({ pieces }: { pieces: OutfitPiece[] }) {
  const hasCutouts = pieces.some((p) => p.cutoutUrl);

  if (hasCutouts) {
    /* Order: bottom layer renders first (behind), top items in front. */
    const order: OutfitSlot[] = ["footwear", "bottom", "top", "layer"];
    const sorted = [...pieces].sort(
      (a, b) => order.indexOf(a.slot) - order.indexOf(b.slot)
    );

    return (
      <div className="mannequin mannequin--real">
        {sorted.map((p, i) =>
          p.cutoutUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={i}
              src={p.cutoutUrl}
              alt={p.name}
              className="mannequin__piece"
              loading="lazy"
              draggable={false}
              style={{ zIndex: i + 1 }}
            />
          ) : null
        )}
        <span className="mannequin__label">on you</span>
      </div>
    );
  }

  /* Fallback: SVG colour figure */
  const top = pick(pieces, "top", "#8E897D")!;
  const layer = pick(pieces, "layer", null);
  const bottom = pick(pieces, "bottom", "#5A554B")!;
  const feet = pick(pieces, "footwear", "#2A2824")!;
  const skin = "#C9B79E";

  return (
    <div className="mannequin">
      <svg viewBox="0 0 120 176" fill="none" aria-hidden="true">
        {/* head + neck */}
        <circle cx="60" cy="20" r="13" fill={skin} />
        <rect x="54" y="31" width="12" height="10" fill={skin} />
        {/* torso (top) */}
        <rect x="41" y="40" width="38" height="56" rx="9" fill={top} />
        {/* arms */}
        <rect x="30" y="43" width="11" height="44" rx="5.5" fill={top} />
        <rect x="79" y="43" width="11" height="44" rx="5.5" fill={top} />
        {/* layer = open jacket panels over the torso edges */}
        {layer && (
          <>
            <rect x="37" y="40" width="12" height="58" rx="6" fill={layer} />
            <rect x="71" y="40" width="12" height="58" rx="6" fill={layer} />
          </>
        )}
        {/* legs (bottom) */}
        <rect x="44" y="98" width="15" height="52" rx="5" fill={bottom} />
        <rect x="61" y="98" width="15" height="52" rx="5" fill={bottom} />
        {/* feet (footwear) */}
        <rect x="42" y="150" width="18" height="10" rx="4" fill={feet} />
        <rect x="60" y="150" width="18" height="10" rx="4" fill={feet} />
      </svg>
      <span className="mannequin__label">mannequin preview</span>
    </div>
  );
}
