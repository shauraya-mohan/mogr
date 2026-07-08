"use client";

import { useEffect, useState } from "react";

/** Fires once per day, the moment every pinned routine step gets ticked.
 *  Uses the same cloud/ink card tokens as the rest of the dashboard so it
 *  tracks light/dark mode correctly, with a bronze border + badge to make
 *  the moment read as a celebration, not just another card. Auto-dismisses;
 *  respects prefers-reduced-motion. */
export default function StreakCelebration({
  days,
  message,
  onClose,
}: {
  days: number | null;
  message: string | null;
  onClose: () => void;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!message) return;
    const raf = requestAnimationFrame(() => setShown(true));
    const timer = setTimeout(onClose, 5200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      setShown(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  if (!message) return null;

  return (
    <div
      role="status"
      className={`fixed inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-[100] mx-auto max-w-[400px] transition-all duration-500 ease-[var(--ease)] motion-reduce:transition-none narrow:inset-x-auto narrow:right-[clamp(16px,3vw,32px)] narrow:bottom-[clamp(16px,3vh,32px)] narrow:mx-0 ${
        shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"
      }`}
    >
      <div className="flex items-start gap-3.5 rounded-[18px] border-[1.5px] border-bronze bg-cloud px-5 py-4 text-ink shadow-[0_2px_8px_rgba(0,0,0,0.22)]">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bronze text-bone" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-bronze">
            streak · day {days ?? ""}
          </p>
          <p className="mt-1.5 font-display text-[15px] font-medium leading-snug tracking-[-0.01em] text-ink">
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-stone transition-colors hover:bg-[var(--ink-08)] hover:text-ink"
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
