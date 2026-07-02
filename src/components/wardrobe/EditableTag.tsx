"use client";

import { useEffect, useRef, useState } from "react";

function Caret() {
  return (
    <svg className="caret-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/**
 * A single editable tag: shows the current value, opens a popover of allowed
 * values from the taxonomy, and reports changes up. Used on the scan-result
 * screen so the user can correct the vision model before saving.
 */
export default function EditableTag({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Show the value even if it's off-taxonomy (e.g. "unclear"); offer options too.
  const opts = options.includes(value) ? options : [value, ...options];

  return (
    <div ref={ref} className={`editable-tag${open ? " is-open" : ""}`}>
      <button type="button" className="editable-tag__btn" onClick={() => setOpen((v) => !v)}>
        <span className="val">{value || "unclear"}</span>
        <Caret />
      </button>
      <div className="tag-pop">
        {opts.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`pop-opt${opt === value ? " is-picked" : ""}`}
            onClick={() => {
              onChange(opt);
              setOpen(false);
            }}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
