"use client";

import { useEffect, useState } from "react";
import {
  CATEGORY_OPTIONS,
  FIT_OPTIONS,
  FORMALITY_OPTIONS,
  PATTERN_OPTIONS,
  STYLE_OPTIONS,
  colourLabel,
  type GarmentTags,
} from "@/lib/wardrobe/content";
import { updateGarment } from "@/lib/wardrobe/store";
import EditableTag from "@/components/wardrobe/EditableTag";

/** Editor for a single garment's tags. Saves back to wardrobe_items. */
export default function GarmentEditModal({
  id,
  cutoutUrl,
  tags,
  onClose,
  onSaved,
}: {
  id: string;
  cutoutUrl: string | null;
  tags: GarmentTags;
  onClose: () => void;
  onSaved: (tags: GarmentTags) => void;
}) {
  const [edited, setEdited] = useState<GarmentTags>(tags);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const setField = <K extends keyof GarmentTags>(key: K, value: GarmentTags[K]) =>
    setEdited((t) => ({ ...t, [key]: value }));

  const metaChips = [
    edited.material,
    ...(edited.season ?? []),
    ...(edited.occasions ?? []),
    ...(edited.details ?? []),
  ].filter((x) => x && x !== "unclear");

  async function save() {
    setSaving(true);
    try {
      await updateGarment(id, edited);
      onSaved(edited);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-[rgba(10,10,8,0.55)] p-4 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="relative max-h-[88vh] w-full max-w-[560px] overflow-y-auto rounded-[20px] border border-[var(--ink-12)] bg-cloud p-6 shadow-[0_28px_70px_-24px_rgba(27,27,25,0.5)]"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "itemModalIn 0.28s cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="eyebrow">edit item</p>
            <h2 className="mt-2 font-display text-[22px] font-bold tracking-[-0.02em] text-ink">
              {edited.name || "Garment"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone transition-colors hover:bg-[var(--ink-08)] hover:text-ink"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-[110px_1fr] gap-5 max-[440px]:grid-cols-1">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[12px] border border-[var(--ink-08)] bg-bone max-[440px]:max-w-[150px]">
            {cutoutUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="cutout" src={cutoutUrl} alt={edited.name} />
            ) : (
              <div className="garment-ph">
                <span className="garment-ph__label">no image</span>
              </div>
            )}
          </div>

          <div className="tag-list">
            <div className="tag-row">
              <span className="tag-row__key">Name</span>
              <input
                className="tag-input"
                value={edited.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>
            <div className="tag-row">
              <span className="tag-row__key">Category</span>
              <EditableTag
                value={edited.category}
                options={CATEGORY_OPTIONS}
                onChange={(v) => setField("category", v as GarmentTags["category"])}
              />
            </div>
            <div className="tag-row">
              <span className="tag-row__key">Type</span>
              <input
                className="tag-input"
                value={edited.subtype}
                onChange={(e) => setField("subtype", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="tag-list mt-3">
          <div className="tag-row">
            <span className="tag-row__key">Colours</span>
            <div className="colour-chips">
              {edited.colors.map((c, i) => (
                <span className="swatch-chip is-readonly" key={i}>
                  <span className="mini-swatch" style={{ background: c.hex }} />
                  {colourLabel(c)}
                </span>
              ))}
            </div>
          </div>
          <div className="tag-row">
            <span className="tag-row__key">Pattern</span>
            <EditableTag value={edited.pattern} options={PATTERN_OPTIONS} onChange={(v) => setField("pattern", v)} />
          </div>
          <div className="tag-row">
            <span className="tag-row__key">Fit</span>
            <EditableTag value={edited.fit} options={FIT_OPTIONS} onChange={(v) => setField("fit", v)} />
          </div>
          <div className="tag-row">
            <span className="tag-row__key">Formality</span>
            <EditableTag value={edited.formality} options={FORMALITY_OPTIONS} onChange={(v) => setField("formality", v)} />
          </div>
          <div className="tag-row">
            <span className="tag-row__key">Style</span>
            <EditableTag
              value={edited.style[0] ?? "unclear"}
              options={STYLE_OPTIONS}
              onChange={(v) => setField("style", [v, ...edited.style.slice(1)])}
            />
          </div>
        </div>

        {metaChips.length > 0 && (
          <div className="tag-chips">
            {metaChips.map((m, i) => (
              <span className="tag-chip" key={i}>
                {m}
              </span>
            ))}
          </div>
        )}

        <div className="result-actions">
          <button className="btn btn-lg" type="button" onClick={save} disabled={saving}>
            <span className="btn-dot" />
            {saving ? "Saving" : "Save changes"}
          </button>
          <button className="btn btn-secondary btn-lg" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
