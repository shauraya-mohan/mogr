import type { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

declare global {
  interface Window {
    /** Set by useLandingMotion so non-motion code (e.g. ThemeToggle) can
     *  ask ScrollTrigger to recompute pinned/scroll positions after a
     *  layout-affecting change. Undefined until the motion layer mounts. */
    ScrollTrigger?: typeof ScrollTrigger;
    /** The active Lenis smooth-scroll instance, if running. */
    __mogrLenis?: Lenis | null;
    /** Updates the sticky header's scrolled state for a given scrollY. */
    __mogrHeaderUpdate?: (y: number) => void;
  }
}

export {};
