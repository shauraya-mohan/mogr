"use client";

import { useEffect, useRef, useState } from "react";
import { colourLabel, type DetectedField } from "@/lib/wardrobe/content";

function Caret() {
  return (
    <svg className="caret-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/**
 * A detected attribute the user can correct before adding the item. Text
 * fields open a popover of alternatives; the colour field renders one swatch
 * chip per detected hex, each with its own picker. TODO(backend): seed from
 * the tagger JSON; PATCH /api/wardrobe/items/{id} with overrides.
 */
export default function EditableTag({ field }: { field: DetectedField }) {
  const ref = useRef<HTMLDivElement>(null);
  // openKey identifies which popover is open: "text" or a colour index.
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [textValue, setTextValue] = useState(
    field.type === "text" ? field.value : ""
  );
  const [colourValues, setColourValues] = useState<string[]>(
    field.type === "colour" ? [...field.value] : []
  );

  useEffect(() => {
    if (openKey === null) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenKey(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenKey(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openKey]);

  if (field.type === "text") {
    const open = openKey === "text";
    return (
      <div ref={ref} className={`editable-tag${open ? " is-open" : ""}`}>
        <button
          type="button"
          className="editable-tag__btn"
          onClick={() => setOpenKey(open ? null : "text")}
        >
          <span className="val">{textValue}</span>
          <Caret />
        </button>
        <div className="tag-pop">
          {field.options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`pop-opt${opt === textValue ? " is-picked" : ""}`}
              onClick={() => {
                setTextValue(opt);
                setOpenKey(null);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // colour field — several swatch chips
  return (
    <div ref={ref} className="colour-chips">
      {colourValues.map((hex, idx) => {
        const open = openKey === `c${idx}`;
        return (
          <div key={idx} className={`editable-tag${open ? " is-open" : ""}`}>
            <button
              type="button"
              className="swatch-chip"
              onClick={() => setOpenKey(open ? null : `c${idx}`)}
            >
              <span className="mini-swatch" style={{ background: hex }} />
              <span className="val">{colourLabel(hex)}</span>
            </button>
            <div className="tag-pop">
              {field.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`pop-opt swatch-opt${opt === hex ? " is-picked" : ""}`}
                  onClick={() => {
                    setColourValues((prev) => {
                      const next = [...prev];
                      next[idx] = opt;
                      return next;
                    });
                    setOpenKey(null);
                  }}
                >
                  <span className="mini-swatch" style={{ background: opt }} />
                  {colourLabel(opt)}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
