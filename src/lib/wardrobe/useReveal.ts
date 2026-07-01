"use client";

import { useEffect, type RefObject } from "react";

/* ============================================================
   useReveal — calm staggered fade-in for .rise nodes.
   Port of the reveal pass in the prototype's wardrobe-shell.js:
   these are app pages (no GSAP), so content fades up on mount
   rather than on scroll. Honours data-rise-delay, prefers-
   reduced-motion, and degrades to visible (globals/wardrobe.css
   already show .rise statically if JS never runs).

   Pass a container ref and a `deps` key; every time the key
   changes (e.g. results get injected) any not-yet-revealed
   .rise descendants animate in.
   ============================================================ */
export function useReveal(
  ref: RefObject<HTMLElement | null>,
  deps: unknown[] = []
) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>(".rise:not(.in)")
    );
    if (!nodes.length) return;

    if (reduced) {
      nodes.forEach((el) => el.classList.add("in"));
      return;
    }

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        nodes.forEach((el, i) => {
          const attr = el.getAttribute("data-rise-delay");
          const delay = attr != null ? parseFloat(attr) : Math.min(i * 0.04, 0.4);
          el.style.transitionDelay = `${delay}s`;
          el.classList.add("in");
        });
      });
    });

    // Failsafe: never leave a reveal stuck hidden (frozen animation clock).
    const failsafe = setTimeout(() => {
      nodes.forEach((el) => el.classList.add("in"));
    }, 1200);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(failsafe);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
