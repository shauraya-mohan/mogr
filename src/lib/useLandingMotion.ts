"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

/**
 * The landing page's motion layer — GSAP + ScrollTrigger + Lenis smooth scroll.
 * Ported from the prototype's main.js. Motion is slow + deliberate (no bounce)
 * and degrades gracefully under prefers-reduced-motion.
 *
 * Runs once on mount and targets DOM by the same class/id contract the section
 * components render (.reveal-up, [data-masked] .word, #heroStage, #how, etc.).
 * The typewriter, theme toggle and sound toggle are React-owned and live in
 * their own components — they are intentionally NOT handled here.
 */
export function useLandingMotion() {
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const EASE = "power3.out";
    const motionSpeed = 1;
    const dur = (d = 0.95) => d / motionSpeed;

    document.documentElement.classList.add("js-ready");

    /* ---- Header scrolled state (works with or without Lenis) ---- */
    const header = document.getElementById("siteHeader");
    const hero = document.getElementById("hero");
    const updateHeader = (y: number) => {
      if (!header) return;
      const threshold = hero ? hero.offsetHeight * 0.55 : 400;
      header.classList.toggle("is-scrolled", y > threshold);
    };
    window.__mogrHeaderUpdate = updateHeader;
    updateHeader(window.scrollY || 0);

    /* ---- Reduced motion: snap everything to final, skip GSAP ---- */
    if (reduced) {
      document
        .querySelectorAll<HTMLElement>(".mask > .word")
        .forEach((w) => (w.style.transform = "none"));
      const onScroll = () => updateHeader(window.scrollY);
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onScroll);
        delete window.__mogrHeaderUpdate;
      };
    }

    gsap.registerPlugin(ScrollTrigger);
    window.ScrollTrigger = ScrollTrigger;

    const ctx = gsap.context(() => {
      /* ---- Lenis smooth scroll, wired into GSAP's ticker ---- */
      const lenis = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      window.__mogrLenis = lenis;
      lenis.on("scroll", (e: { scroll: number }) => {
        ScrollTrigger.update();
        updateHeader(e.scroll ?? window.scrollY);
      });
      const tickerFn = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);

      // anchor links → smooth scroll via lenis
      const anchors =
        document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
      const anchorHandlers: Array<[HTMLAnchorElement, (e: Event) => void]> = [];
      anchors.forEach((a) => {
        const handler = (e: Event) => {
          const id = a.getAttribute("href") || "";
          if (id.length < 2) return;
          const target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          lenis.scrollTo(target as HTMLElement, { offset: -72 });
        };
        a.addEventListener("click", handler);
        anchorHandlers.push([a, handler]);
      });

      /* ---- Generic reveals — .reveal-up (robust per-element triggers) ---- */
      gsap.utils.toArray<HTMLElement>(".reveal-up").forEach((el) => {
        gsap.to(el, {
          y: 0,
          opacity: 1,
          duration: dur(1.0),
          ease: EASE,
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none none",
          },
        });
      });

      /* ---- Masked heading reveals (words slide up from behind edge) ---- */
      document.querySelectorAll<HTMLElement>("[data-masked]").forEach((h) => {
        const words = h.querySelectorAll(".word");
        gsap.set(words, { yPercent: 115 });
        ScrollTrigger.create({
          trigger: h,
          start: "top 82%",
          once: true,
          onEnter: () => {
            gsap.to(words, {
              yPercent: 0,
              duration: dur(1.1),
              ease: EASE,
              stagger: 0.12 / motionSpeed,
            });
          },
        });
      });

      /* ---- Hero video stage: pin to the viewport for a while ---- */
      const stage = document.getElementById("heroStage");
      if (stage) {
        ScrollTrigger.create({
          trigger: stage,
          start: "top top",
          end: "+=120%",
          pin: true,
          pinSpacing: true,
        });
      }

      /* ---- Pinned how-it-works: steps swap as you scroll ---- */
      const how = document.getElementById("how");
      const howStage = document.getElementById("howStage");
      const howProg = document.getElementById("howProgress");
      if (how && howStage) {
        const steps = Array.from(
          howStage.querySelectorAll<HTMLElement>(".how-step"),
        );
        const ticks = howProg
          ? Array.from(howProg.querySelectorAll<HTMLElement>(".tick"))
          : [];
        const count = steps.length;
        let current = -1;

        const setActive = (idx: number) => {
          if (idx === current) return;
          current = idx;
          steps.forEach((s, i) => {
            const on = i === idx;
            s.classList.toggle("is-active", on);
            if (on) {
              const body = s.querySelector(".how-step__body");
              if (body) {
                gsap.fromTo(
                  body,
                  { y: 26, opacity: 0 },
                  {
                    y: 0,
                    opacity: 1,
                    duration: dur(0.85),
                    ease: EASE,
                    overwrite: true,
                  },
                );
              }
            }
          });
          ticks.forEach((t, i) => t.classList.toggle("is-on", i <= idx));
        };
        setActive(0);

        ScrollTrigger.create({
          trigger: how,
          start: "top top",
          end: "+=" + count * 70 + "%", // ~0.7 viewport per step (30% shorter)
          pin: ".how-pin",
          pinSpacing: true,
          scrub: false,
          onUpdate: (self) => {
            let idx = Math.min(
              count - 1,
              Math.floor(self.progress * count - 0.0001),
            );
            if (idx < 0) idx = 0;
            setActive(idx);
          },
        });
      }

      /* ---- CTA multi-line slide-up reveal ---- */
      const cta = document.getElementById("ctaHeadline");
      if (cta) {
        const lines = cta.querySelectorAll(".line > span");
        gsap.set(lines, { yPercent: 115 });
        ScrollTrigger.create({
          trigger: cta,
          start: "top 80%",
          once: true,
          onEnter: () => {
            gsap.to(lines, {
              yPercent: 0,
              duration: dur(1.15),
              ease: EASE,
              stagger: 0.14 / motionSpeed,
            });
          },
        });
      }

      /* ---- Refresh after fonts load / window load ---- */
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }
      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad);

      /* ---- Failsafe — never leave content stuck in its hidden
         pre-animation state if the render loop is paused (e.g. the page
         loads in a background tab so rAF / GSAP's ticker never advance). ---- */
      const snapToFinal = () => {
        gsap.set(".reveal-up", { opacity: 1, y: 0 });
        gsap.set("[data-masked] .word", { yPercent: 0 });
        gsap.set("#ctaHeadline .line > span", { yPercent: 0 });
      };
      const failsafe = window.setTimeout(() => {
        if (gsap.ticker.frame < 2) snapToFinal();
      }, 2400);

      const onVisibility = () => {
        if (!document.hidden) ScrollTrigger.refresh();
      };
      document.addEventListener("visibilitychange", onVisibility);

      // Cleanup registered inside the context so gsap.context can revert tweens.
      return () => {
        anchorHandlers.forEach(([a, h]) => a.removeEventListener("click", h));
        gsap.ticker.remove(tickerFn);
        window.removeEventListener("load", onLoad);
        document.removeEventListener("visibilitychange", onVisibility);
        window.clearTimeout(failsafe);
        lenis.destroy();
        window.__mogrLenis = null;
      };
    });

    return () => {
      ctx.revert(); // kills all tweens/triggers + runs the inner cleanup
      delete window.ScrollTrigger;
      delete window.__mogrHeaderUpdate;
    };
  }, []);
}
