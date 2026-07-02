"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  INVENTORY_FILTERS,
  FILTER_NOUN,
  type Category,
  type GarmentColor,
  type WardrobeItemRow,
} from "@/lib/wardrobe/content";
import { fetchWardrobe, deleteGarment } from "@/lib/wardrobe/store";
import { useReveal } from "@/lib/wardrobe/useReveal";
import GarmentCard from "@/components/wardrobe/GarmentCard";

type Filter = "all" | Category;
type Item = WardrobeItemRow & { cutoutUrl: string | null };

export default function WardrobeInventoryPage() {
  const [items, setItems] = useState<Item[] | null>(null); // null = loading
  const [filter, setFilter] = useState<Filter>("all");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchWardrobe()
      .then((rows) => setItems(rows as Item[]))
      .catch(() => setItems([]));
  }, []);

  const loading = items === null;
  const all = items ?? [];
  const visible = all.filter((i) => filter === "all" || i.category === filter);

  useReveal(containerRef, [loading, filter, visible.length]);

  const isEmpty = !loading && all.length === 0;
  const noun = visible.length === 1 ? "piece" : "pieces";
  const countText =
    filter === "all"
      ? `${visible.length} ${noun}`
      : `${visible.length} ${noun} · ${FILTER_NOUN[filter]}`;

  async function remove(item: Item) {
    setItems((prev) => (prev ?? []).filter((i) => i.id !== item.id));
    try {
      await deleteGarment(item.id, item.image_url);
    } catch {
      // Re-fetch on failure so the UI reflects the true state.
      fetchWardrobe().then((rows) => setItems(rows as Item[])).catch(() => {});
    }
  }

  return (
    <div className="style-layout" ref={containerRef}>
      {/* Header */}
      <header className="page-head">
        <div>
          <p className="eyebrow rise">wardrobe</p>
          <h1 className="page-title rise" data-rise-delay="0.05">
            Your closet<span className="dot">.</span>
          </h1>
          {!isEmpty && !loading && (
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

      {loading && (
        <section className="closet-grid" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <article className="garment-card is-processing" key={i}>
              <div className="garment-card__stage">
                <div className="skeleton" />
              </div>
              <div className="garment-card__foot">
                <p className="garment-card__name" style={{ color: "var(--stone)" }}>
                  Loading…
                </p>
              </div>
            </article>
          ))}
        </section>
      )}

      {!loading && !isEmpty && (
        <>
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

          <section className="closet-grid" aria-label="Your garments">
            {visible.map((item, i) => (
              <GarmentCard
                key={item.id}
                name={item.name ?? item.data?.name ?? "Garment"}
                cutoutUrl={item.cutoutUrl}
                colors={(item.data?.colors ?? []) as GarmentColor[]}
                formality={item.data?.formality}
                fit={item.data?.fit}
                riseDelay={Math.min(i * 0.03, 0.3)}
                onRemove={() => remove(item)}
              />
            ))}
          </section>
        </>
      )}

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
