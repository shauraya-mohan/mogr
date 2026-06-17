"use client";

import { useLandingMotion } from "@/lib/useLandingMotion";

/** Mounts the GSAP/Lenis motion layer once. Renders nothing. */
export default function Motion() {
  useLandingMotion();
  return null;
}
