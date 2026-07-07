"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { OutfitSlot } from "@/lib/wardrobe/content";
import { THEMES, themeFor, type SavedLook, type ClosetPickerItem, groupClosetBySlot } from "@/lib/wardrobe/looks";
import { fetchLooks, createLook, updateLook, deleteLook } from "@/lib/wardrobe/looksStore";
import { fetchWardrobe } from "@/lib/wardrobe/store";
import { useReveal } from "@/lib/wardrobe/useReveal";
import LookCard from "@/components/wardrobe/looks/LookCard";
import LookPreview from "@/components/wardrobe/looks/LookPreview";
import LookFormModal, { type LookFormResult } from "@/components/wardrobe/looks/LookFormModal";

type FormState = { editing: SavedLook | null } | null;
const EMPTY_CLOSET: Record<OutfitSlot, ClosetPickerItem[]> = {
  top: [], layer: [], bottom: [], footwear: [], accessory: [],
};

export default function SavedLooksPage() {
  const [looks, setLooks] = useState<SavedLook[] | null>(null); // null = loading
  const [closet, setCloset] = useState<Record<OutfitSlot, ClosetPickerItem[]>>(EMPTY_CLOSET);
  const [activeFilter, setActiveFilter] = useState("all");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(null);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLooks().then(setLooks).catch(() => setLooks([]));
    fetchWardrobe().then((items) => setCloset(groupClosetBySlot(items))).catch(() => {});
  }, []);

  const all = looks ?? [];
  const previewLook = all.find((l) => l.id === previewId) ?? null;

  useEffect(() => {
    document.body.style.overflow = previewLook || form ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [previewLook, form]);

  const presentOccasions = useMemo(
    () =>
      Object.keys(THEMES).filter((key) =>
        all.some((l) => (l.occasion || "everyday").toLowerCase() === key)
      ),
    [all]
  );
  const visible = all.filter(
    (l) => activeFilter === "all" || (l.occasion || "everyday").toLowerCase() === activeFilter
  );

  useReveal(containerRef, [all.length, activeFilter, looks === null]);

  async function handleSave(result: LookFormResult) {
    setSaving(true);
    try {
      if (form?.editing) {
        const updated = await updateLook(form.editing.id, result);
        setLooks((prev) => (prev ?? []).map((l) => (l.id === updated.id ? updated : l)));
        if (previewId === updated.id) setPreviewId(updated.id);
      } else {
        const created = await createLook(result);
        setLooks((prev) => [created, ...(prev ?? [])]);
      }
      setForm(null);
    } catch (e) {
      console.error("[looks] save failed:", e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setPreviewId(null);
    setLooks((prev) => (prev ?? []).filter((l) => l.id !== id));
    try {
      await deleteLook(id);
    } catch (e) {
      console.error("[looks] delete failed:", e);
      fetchLooks().then(setLooks).catch(() => {});
    }
  }

  const loading = looks === null;
  const isEmpty = !loading && all.length === 0;
  const countText =
    all.length + (all.length === 1 ? " look" : " looks") +
    (activeFilter === "all" ? "" : ` · ${themeFor(activeFilter).label}`);

  return (
    <div className="style-layout" ref={containerRef}>
      <header className="page-head">
        <div>
          <p className="eyebrow rise">your looks</p>
          <h1 className="page-title rise" data-rise-delay="0.05">
            Saved looks<span className="dot">.</span>
          </h1>
          {!isEmpty && !loading && (
            <p className="page-count rise" data-rise-delay="0.1">{countText}</p>
          )}
        </div>
        <div className="head-actions rise" data-rise-delay="0.12">
          <button className="btn btn-bronze" type="button" onClick={() => setForm({ editing: null })}>
            <svg className="btn__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 8.2v7.6M8.2 12h7.6" />
            </svg>
            Create look
          </button>
        </div>
      </header>

      {loading && (
        <section className="looks-grid" aria-hidden>
          {Array.from({ length: 3 }).map((_, i) => (
            <article className="look-card" key={i} style={{ opacity: 0.6 }}>
              <div className="look-card__preview">
                <div className="skeleton" style={{ gridColumn: "1 / -1", gridRow: "1 / -1", borderRadius: 10 }} />
              </div>
              <div className="look-card__foot">
                <p className="look-card__name" style={{ color: "var(--stone)" }}>Loading…</p>
              </div>
            </article>
          ))}
        </section>
      )}

      {!loading && !isEmpty && (
        <>
          <div className="filter-row rise" data-rise-delay="0.15" role="tablist" aria-label="Filter looks by occasion">
            <button
              type="button"
              className={`chip${activeFilter === "all" ? " is-active" : ""}`}
              role="tab"
              aria-selected={activeFilter === "all"}
              onClick={() => setActiveFilter("all")}
            >
              All
            </button>
            {presentOccasions.map((key) => (
              <button
                key={key}
                type="button"
                className={`chip${activeFilter === key ? " is-active" : ""}`}
                role="tab"
                aria-selected={activeFilter === key}
                onClick={() => setActiveFilter(key)}
              >
                {THEMES[key].label}
              </button>
            ))}
          </div>

          <section className="looks-grid" aria-label="Saved looks">
            {visible.map((look, i) => (
              <LookCard
                key={look.id}
                look={look}
                riseDelay={Math.min(i * 0.04, 0.32)}
                onOpen={() => setPreviewId(look.id)}
              />
            ))}
          </section>
        </>
      )}

      {isEmpty && (
        <section className="empty-state">
          <p className="eyebrow" style={{ justifyContent: "center" }}>your looks</p>
          <h2>No looks saved yet<span className="dot">.</span></h2>
          <p>Build an outfit from your closet and save it here — every look you put together, ready to wear again.</p>
          <button className="btn btn-lg btn-bronze" type="button" onClick={() => setForm({ editing: null })}>
            <svg className="btn__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 8.2v7.6M8.2 12h7.6" />
            </svg>
            Create look
          </button>
        </section>
      )}

      <LookPreview
        look={previewLook}
        onClose={() => setPreviewId(null)}
        onEdit={(look) => setForm({ editing: look })}
        onDelete={handleDelete}
      />

      {form && (
        <LookFormModal
          key={form.editing?.id ?? "create"}
          mode={form.editing ? "edit" : "create"}
          initial={
            form.editing
              ? { name: form.editing.name, occasion: form.editing.occasion, rationale: form.editing.rationale, pieces: form.editing.pieces }
              : { name: "", occasion: "everyday", pieces: [] }
          }
          closet={closet}
          saving={saving}
          onClose={() => setForm(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
