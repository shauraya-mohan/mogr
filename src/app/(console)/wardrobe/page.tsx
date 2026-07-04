"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  INVENTORY_FILTERS,
  FILTER_NOUN,
  type Category,
  type GarmentColor,
  type GarmentTags,
  type WardrobeItemRow,
} from "@/lib/wardrobe/content";
import { fetchWardrobe, deleteGarment } from "@/lib/wardrobe/store";
import { useReveal } from "@/lib/wardrobe/useReveal";
import GarmentCard from "@/components/wardrobe/GarmentCard";
import GarmentEditModal from "@/components/wardrobe/GarmentEditModal";
import { FILTER_ICONS } from "@/components/wardrobe/categoryIcons";

type Filter = "all" | Category;
type Item = WardrobeItemRow & { cutoutUrl: string | null };

/** Editable tag set for an item, with a fallback for legacy rows lacking data. */
function toTags(item: Item): GarmentTags {
  return (
    item.data ?? {
      isGarment: true,
      name: item.name ?? "Garment",
      category: (item.category as GarmentTags["category"]) ?? "unclear",
      subtype: "",
      colors: item.color ? [{ name: "Colour", hex: item.color }] : [],
      pattern: "unclear",
      print: null,
      style: [],
      fit: "unclear",
      formality: "unclear",
      material: "unclear",
      season: [],
      occasions: [],
      details: [],
      notes: "",
    }
  );
}

/** A quiet hanger-rail illustration for the empty closet. */
function ClosetArt() {
  const hangers = [74, 130, 186];
  return (
    <div className="closet-art" aria-hidden>
      <svg viewBox="0 0 260 122" fill="none">
        <line x1="22" y1="30" x2="238" y2="30" stroke="var(--ink-12)" strokeWidth="2" strokeLinecap="round" />
        {hangers.map((cx) => (
          <g key={cx} stroke="var(--stone)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <circle cx={cx} cy="24" r="3.6" />
            <path d={`M${cx} 28 L${cx - 30} 58 Q${cx - 34} 64 ${cx - 27} 64 L${cx + 27} 64 Q${cx + 34} 64 ${cx + 30} 58 Z`} />
            <path d={`M${cx - 26} 62 q-2 28 7 44 M${cx + 26} 62 q2 28 -7 44`} opacity="0.55" />
          </g>
        ))}
      </svg>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg className="btn__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8.6A2 2 0 0 1 5 6.6h1.5l1-1.7a1 1 0 0 1 .85-.5h5.3a1 1 0 0 1 .85.5l1 1.7H19a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="12.4" r="3.2" />
    </svg>
  );
}

export default function WardrobeInventoryPage() {
  const [items, setItems] = useState<Item[] | null>(null); // null = loading
  const [filter, setFilter] = useState<Filter>("all");
  const [editTarget, setEditTarget] = useState<Item | null>(null);
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

  function onSaved(itemId: string, tags: GarmentTags) {
    setItems((prev) =>
      (prev ?? []).map((i) =>
        i.id === itemId
          ? { ...i, name: tags.name, category: tags.category, data: tags }
          : i
      )
    );
    setEditTarget(null);
  }

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
            {INVENTORY_FILTERS.map((f) => {
              const Icon = FILTER_ICONS[f.value];
              return (
                <button
                  key={f.value}
                  type="button"
                  className={`chip${filter === f.value ? " is-active" : ""}`}
                  role="tab"
                  aria-selected={filter === f.value}
                  onClick={() => setFilter(f.value)}
                >
                  {Icon && <Icon className="chip__ic" />}
                  {f.label}
                </button>
              );
            })}
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
                onEdit={() => setEditTarget(item)}
                onRemove={() => remove(item)}
              />
            ))}
          </section>
        </>
      )}

      {isEmpty && (
        <section className="closet-empty">
          <ClosetArt />
          <p className="eyebrow" style={{ justifyContent: "center" }}>
            wardrobe
          </p>
          <h2 className="closet-empty__title">
            Start building your closet<span className="dot">.</span>
          </h2>
          <p className="closet-empty__sub">
            Scan the clothes you own, one piece at a time. We cut them out, tag
            them, and start styling from what&apos;s actually yours.
          </p>
          <div className="closet-empty__actions">
            <Link className="btn btn-lg btn-bronze" href="/wardrobe/scan">
              <CameraIcon />
              Scan your first item
            </Link>
          </div>
        </section>
      )}

      {editTarget && (
        <GarmentEditModal
          id={editTarget.id}
          cutoutUrl={editTarget.cutoutUrl}
          tags={toTags(editTarget)}
          onClose={() => setEditTarget(null)}
          onSaved={(t) => onSaved(editTarget.id, t)}
        />
      )}
    </div>
  );
}
