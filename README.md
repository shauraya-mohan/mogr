# mogr

Men's grooming web app. See [`PRD.md`](./PRD.md) for product scope.

This repo currently holds the **landing page**, refactored from the Claude Design
prototype into a Next.js + TypeScript + **Tailwind v4** app so its interactive
elements can be wired to real behavior as the product is built.

## Styling — read this before building features

One system: **Tailwind v4**. The brand palette, fonts and breakpoints live once
in `src/app/globals.css` as CSS variables, mirrored into `@theme inline` so they
power utilities (`bg-bone`, `text-bronze`, `font-display`, `max-[620px]:` …).
Because the tokens are `inline`, every utility reads `var(--bronze)` etc. at the
use site, so **dark mode flips automatically** when `[data-theme="dark"]`
overrides those vars — no `dark:` variants needed for color.

- **Build all feature UI with utilities.** `SiteFooter.tsx` is the reference
  pattern: zero bespoke CSS, all tokens.
- The landing page's **bespoke editorial + animation styling** (fluid `clamp()`
  type, keyframes, the pinned-scroll/hero-video hooks, pseudo-element brand
  devices) stays in `@layer components` in `globals.css` — utilities can't
  express those more concisely. Layout/structure on the landing page already
  uses utilities.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm run start   # production
```

## Structure

```
src/
  app/
    layout.tsx        Root layout: fonts (next/font), metadata, no-flash theme init
    page.tsx          Composes the landing sections
    globals.css       Tailwind v4 + brand tokens (@theme inline) + dark mode + @layer components
  components/
    Button.tsx        Reusable CTA — href OR onClick (the main interactivity seam)
    ThemeToggle.tsx   Sun/moon dark-mode toggle (state + localStorage)
    Typewriter.tsx    Hero headline cycle (Ascend. / Lock in. / …)
    HeroVideo.tsx     Hero film: muted autoplay, HUD, button-only sound control
    SiteHeader.tsx    Hero / HowItWorks / WhyMogr / Proof / Cta / CategoryGrid / SiteFooter
    Motion.tsx        Mounts the motion layer (renders nothing)
  lib/
    content.ts        All copy/data, typed — swap for a CMS/API later
    useLandingMotion.ts  GSAP + ScrollTrigger + Lenis (reveals, pins, scroll state)
    global.d.ts       Window globals the motion layer exposes
public/assets/        Logos (light/dark) + hero/preview videos
supabase/migrations/  SQL schema (profiles + per-feature tables, RLS)
```

> The original Claude Design prototype has been fully ported; the live code +
> [`DESIGN.md`](./DESIGN.md) are the source of truth. The prototype remains in
> git history (commit `472805d`) if ever needed.

## Making things interactive

The CTAs are `<Button href="#start">` today. To make one *do* something
(open the scan flow, push a route, fire analytics), pass `onClick` — markup
and styling don't change:

```tsx
<Button onClick={() => router.push("/scan")}>Start your scan</Button>
```

Static copy/data lives in `src/lib/content.ts`; the category cards and
before/after frames render placeholder imagery until real images are dropped in.

The React "Tweaks panel" from the prototype (design-tool dev chrome) was
intentionally dropped.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · GSAP + ScrollTrigger + Lenis.
