"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ITEMS,
  INVENTORY_FILTERS,
  FILTER_NOUN,
  type Category,
} from "@/lib/wardrobe/content";
import { useReveal } from "@/lib/wardrobe/useReveal";
import GarmentCard from "@/components/wardrobe/GarmentCard";

type Filter = "all" | Category;

export default function WardrobeInventoryPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  // Freshly-scanned item hand-off (?added=1 from the scan flow).
  const [pending, setPending] = useState(false);

  const gridRef = useRef<HTMLElement>(null);

  // Detect the scan → inventory hand-off without useSearchParams (keeps this a
  // plain client page — no Suspense boundary needed).
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("added") === "1") {
      setPending(true);
      // TODO(backend): the real item arrives from the POST that created it;
      // poll GET /api/wardrobe/items/{id} until status:"ready".
      const t = setTimeout(() => setPending(false), 2600);
      return () => clearTimeout(t);
    }
  }, []);

  const visible = ITEMS.filter(
    (i) => !removed.has(i.name) && (filter === "all" || i.cat === filter)
  );

  useReveal(gridRef, [filter, visible.length, pending]);

  const showPending = pending && (filter === "all" || filter === "outerwear");
  const isEmpty = visible.length === 0 && !showPending;

  const noun = visible.length === 1 ? "piece" : "pieces";
  const countText =
    filter === "all"
      ? `${visible.length} ${noun}`
      : `${visible.length} ${noun} · ${FILTER_NOUN[filter]}`;

  function remove(name: string) {
    setRemoved((prev) => new Set(prev).add(name));
  }

  return (
    <div className="style-layout">
      {/* Header */}
      <header className="page-head">
        <div>
          <p className="eyebrow rise">wardrobe</p>
          <h1 className="page-title rise" data-rise-delay="0.05">
            Your closet<span className="dot">.</span>
          </h1>
          {!isEmpty && (
            <p className="page-count rise" data-rise-delay="0.1">
              {countText}
            </p>
          )}
        </div>
        <div className="head-actions rise" data-rise-delay="0.12">
          <Link className="btn btn-bronze" href="/wardrobe/style">
            <svg className="btn__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l1.9 4.8 4.8 1.9-4.8 1.9L12 16.4l-1.9-4.8L5.3 9.7l4.8-1.9z" />
              <path d="M18.4 14.6l.75 1.9 1.9.75-1.9.75-.75 1.9-.75-1.9-1.9-.75 1.9-.75z" />
            </svg>
            Style me
          </Link>
          <Link className="btn" href="/wardrobe/scan">
            <svg className="btn__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 8.6A2 2 0 0 1 5 6.6h1.5l1-1.7a1 1 0 0 1 .85-.5h5.3a1 1 0 0 1 .85.5l1 1.7H19a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <circle cx="12" cy="12.4" r="3.2" />
            </svg>
            Scan item
          </Link>
        </div>
      </header>

      {!isEmpty && (
        <>
          {/* Filter chips */}
          <div className="filter-row rise" data-rise-delay="0.15" role="tablist" aria-label="Filter by category">
            {INVENTORY_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`chip${filter === f.value ? " is-active" : ""}`}
                role="tab"
                aria-selected={filter === f.value}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Closet grid */}
          <section className="closet-grid" ref={gridRef} aria-label="Your garments">
            {showPending && (
              <article className="garment-card is-processing rise in" data-cat="outerwear">
                <div className="garment-card__stage">
                  <div className="skeleton" />
                </div>
                <div className="garment-card__foot">
                  <p className="garment-card__name" style={{ color: "var(--stone)" }}>
                    Processing…
                  </p>
                  <span className="processing-note">tagging</span>
                </div>
              </article>
            )}
            {visible.map((item, i) => (
              <GarmentCard
                key={item.name}
                item={item}
                riseDelay={Math.min(i * 0.03, 0.3)}
                onRemove={() => remove(item.name)}
              />
            ))}
          </section>
        </>
      )}

      {/* Empty state */}
      {isEmpty && (
        <section className="empty-state">
          <p className="eyebrow" style={{ justifyContent: "center" }}>
            wardrobe
          </p>
          <h2>
            Start building your closet<span className="dot">.</span>
          </h2>
          <p>
            Scan the clothes you already own, one piece at a time. We&apos;ll cut
            them out, tag them, and start styling from what&apos;s actually yours.
          </p>
          <Link className="btn btn-lg" href="/wardrobe/scan">
            <span className="btn-dot" />+ Scan your first item
          </Link>
        </section>
      )}
    </div>
  );
}
