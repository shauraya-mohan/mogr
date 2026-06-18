# mogr — Design System

> The single source of truth for how mogr looks, moves, and reads.
> If you (or your AI coding agent) are building anything in this repo, read this
> first. Every token here is already wired into Tailwind — use the utilities, not
> raw hex.

mogr is **men's grooming, systemized** — "the Notion of grooming." The visual
language is **editorial, premium, minimal, precise**: a charcoal-and-bone scheme
with a single bronze accent. Think **barber × tech** — confident and masculine,
never loud.

**Brand keywords:** confident · minimal · precise · premium · masculine · barber × tech · no-nonsense

---

## 1. Color

Six brand colors. **Bronze is the only accent — use it sparingly** (one moment
per view, not everywhere). The page is predominantly Bone (light) / near-black
(dark); dark blocks and the hero film are the contrast.

| Token name | Light value | Role |
|-----------|-------------|------|
| **Ink** | `#1B1B19` | Primary text, dark blocks, solid buttons |
| **Graphite** | `#3A3A36` | Secondary text, body copy |
| **Stone** | `#A39E94` | Muted text, captions, labels |
| **Bronze** | `#B07A3C` | The single accent — dots, rules, hovers, the "." device |
| **Bone** | `#F4F2EC` | Page background |
| **Cloud** | `#FBFAF6` | Raised surfaces / cards |

### Using color in code

Tokens are CSS variables mirrored into Tailwind via `@theme inline`. **Always use
the utility or `var()`, never a raw hex** — that's what makes dark mode work.

```tsx
// ✅ on-brand, theme-aware
<p className="text-graphite">…</p>
<span className="bg-bronze" />
<div className="bg-cloud border border-[var(--ink-08)]" />

// ❌ never
<p style={{ color: "#3A3A36" }}>…</p>
```

Utilities available: `text-ink` `text-graphite` `text-stone` `text-bronze`
`text-bone` · `bg-ink` `bg-bronze` `bg-bone` `bg-cloud` · same for `border-*`.

### Derived (alpha) tokens

For hairlines, washes and scrims — used as `var(--…)`:

| Variable | Light | Use |
|----------|-------|-----|
| `--ink-12` | `rgba(27,27,25,.12)` | Hairline borders, dividers |
| `--ink-08` | `rgba(27,27,25,.08)` | Card borders |
| `--ink-90` | `rgba(27,27,25,.90)` | Card hover wash (overlay) |
| `--bone-70` | `rgba(244,242,236,.70)` | Scrolled header background |

---

## 2. Dark mode — a *designed* theme, not an inversion

Dark mode is the **default**. It's a warm near-black ground with bone text and a
slightly brighter bronze — deliberately designed, not a flipped light theme.

| Token | Dark value |
|-------|-----------|
| Ink (text) | `#F1EEE6` |
| Graphite | `#B4AFA3` |
| Stone | `#6E6A60` |
| Bronze | `#C68A47` *(nudged brighter for the dark ground)* |
| Bone (ground) | `#121210` |
| Cloud (surfaces) | `#1B1B18` |

**How it works (important for agents):** the tokens are defined once in `:root`
and overridden under `[data-theme="dark"]`. Because `@theme inline` makes every
utility resolve `var(--ink)` etc. *at the use site*, **`bg-bone`/`text-ink`/…
flip automatically** when the theme attribute changes. You almost never need a
`dark:` variant for color — just use the token utility and it tracks the theme.

Reach for `dark:` (a real Tailwind variant, scoped to `[data-theme="dark"]`) only
when an element needs a genuinely *different* treatment in dark mode, not just a
recolored token (e.g. dropping a logo's `mix-blend-mode`).

The theme is set before first paint (no flash), persisted to `localStorage`
(`mogr-theme`), and toggled by the header sun/moon button.

---

## 3. Typography

Three families, each with a strict role. Never mix roles.

| Family | Role | Weights | Where |
|--------|------|---------|-------|
| **Space Grotesk** | Display | 700 / 500 | Headlines, wordmark, buttons |
| **Inter** | Body | 400 / 500 | Paragraphs, UI |
| **Space Mono** | Accent | 400 / 700 | Labels, tags, numerals, metadata, eyebrows |

Loaded via `next/font` and exposed as utilities: **`font-display`**,
**`font-body`** (the default on `<body>`), **`font-mono`**.

### Type treatments

Display headlines are **big, tight, and editorial** — large sizes, negative
letter-spacing, line-height near 0.9. They're fluid (`clamp()`), so they live as
component classes in `globals.css` rather than utilities. Reuse these classes:

| Class | Size (fluid) | Tracking / leading |
|-------|--------------|--------------------|
| `.hero-headline` | `clamp(58px,13.5vw,184px)` | `-0.05em` / `0.9` |
| `.cta-headline` | `clamp(56px,13vw,200px)` | `-0.05em` / `0.9` |
| `.section-title` | `clamp(34px,5.2vw,68px)` | `-0.035em` / `1.0` |
| `.why h2` | `clamp(40px,6.4vw,96px)` | `-0.04em` / `0.96` |

**Eyebrows** (`.eyebrow`) are the recurring section kicker: Space Mono, 12px,
uppercase, `0.16em` tracking, Stone, with a bronze dot before the text. Body copy
is Inter, ~16–20px fluid, Graphite, max ~44–46ch line length.

---

## 4. The brand devices

These are what make something feel *mogr* rather than generic. Use them.

### The dot `.`
The period from the logo is the **brand signature**. Reuse it as:
- end-of-line punctuation on headlines (`Scan once<span class="dot">.</span>`)
- button dots, bullet points, list markers, label separators

It's always **Bronze**. The `.dot` class colors it; bullets/button dots are small
bronze circles (`bg-bronze` 5–6px).

### Comb-tooth monoline
A comb-tooth line pattern (echoing the logo's teeth) for **section dividers and
texture** — same stroke weight as the logo.

### Angular cut
Sharp diagonal notches that echo a clean fade / line-up. **Use sparingly** on
cards and image frames.

### Logo
Use the provided lockups — **never redraw**. Horizontal lockup (mark + wordmark)
in the header; full square lockup, larger, in the footer. Light and dark variants
exist (`logo-light` / `logo-dark` swap by theme); the footer light logo drops its
baked bone background via `mix-blend-mode: multiply`.

---

## 5. Layout & spacing

| Token | Value | Meaning |
|-------|-------|---------|
| `--maxw` | `1240px` | Max content width — use the `.container-page` utility |
| `--gutter` | `clamp(20px,5vw,64px)` | Page side padding |
| `--header-h` | `72px` (`64px` ≤620px) | Fixed header height |

- **`.container-page`** — centered max-width wrapper with gutters. Use on every
  full-width section's inner content.
- **`.section-pad`** — the standard vertical section rhythm
  (`clamp(72px,13vh,160px)` block padding).
- **Breakpoints match the design, not Tailwind defaults:** the responsive shifts
  happen at **620px** and **900px**. Use `max-[620px]:` and `max-[900px]:`
  (or the named `narrow:` / `mid:` min-width variants) so layouts stay faithful.
- Generous radii on surfaces (`18px` cards/frames; buttons `10–12px`).

---

## 6. Motion

Motion is **slow, deliberate, and weighted — no bounce.** It should feel premium
and intentional, never springy or playful.

- **Easing:** `--ease: cubic-bezier(0.16, 1, 0.3, 1)` (power-style ease-out). In
  GSAP, `power3.out`.
- **Durations:** entrance tweens ~0.9–1.15s; UI transitions 0.4–0.5s.
- **Patterns:** masked word reveals (text slides up from behind a clip edge),
  line-by-line headline reveals, fade-up on scroll (`.reveal-up`), a typewriter
  hero headline, pinned scroll sections (how-it-works steps swap; hero film pins),
  animated bronze underlines on links, the bronze "REC" pulse on the hero HUD.
- **Stack:** GSAP + ScrollTrigger + Lenis (smooth scroll), all isolated in
  `src/lib/useLandingMotion.ts`. Don't scatter scroll logic into components.

### Reduced motion is non-negotiable
Everything degrades under `prefers-reduced-motion: reduce`: loops stop, reveals
snap to their final visible state, the typewriter shows static text, pinned
sections fall back to normal flow. Any new motion **must** have a reduced-motion
fallback.

---

## 7. Components & patterns

| Pattern | How it's built |
|---------|----------------|
| **Button** | Solid Ink fill on Bone, Bronze dot, tight Space Grotesk, high contrast. Sizes `sm`/`md`/`lg`. In code: `<Button>` (`href` for links, `onClick` for actions). |
| **Eyebrow** | `.eyebrow` — mono, uppercase, Stone, bronze dot. Section kicker. |
| **Nav / text links** | Mono, Graphite → Ink on hover, with an animated bronze underline that wipes in from the left. |
| **Cards** | Cloud surface, `--ink-08` hairline border, 18px radius, placeholder hatch when imageless. Hover reveals an Ink-wash overlay with a growing bronze rule + bone copy. |
| **Hero film** | Full-bleed, pinned, edges softly faded into the page (no rounded card). Autoplays muted; a HUD shows REC timecode / frame counter / bronze progress bar; sound is button-only. |

---

## 8. Voice & tone (applies to all copy)

The product wins on tone — this is a **product principle, not decoration**.

- **Lead with a genuine strength.** Open every result with something that already
  works for the user.
- **Frame improvements as upgrades, not flaws.** "Defining your jawline a touch
  more would sharpen your whole look" — never "your jaw is weak."
- **Qualitative, never quantitative.** No scores, rankings, or percentiles.
- **Confident, motivating, current.** The user should feel capable, not
  self-conscious.
- **Specific and actionable.** Every observation pairs with a concrete next step.

Microcopy is lowercase and unfussy (`start scan`, `log in`, `see how it works →`).
Labels and metadata are uppercase mono.

---

## 9. Quick reference for coding agents

**Do:**
- Build feature UI with **Tailwind utilities + the brand tokens** (`SiteFooter.tsx`
  is the reference pattern).
- Use `text-*/bg-*/border-*` token utilities so dark mode flips for free.
- Reuse the dot device, eyebrows, and the existing display/eyebrow classes.
- Keep motion in the motion hook; give it a reduced-motion fallback.
- Respect the 620 / 900 breakpoints.

**Don't:**
- Hardcode hex/rgb, or invent new colors. Bronze stays rare.
- Add bounce/spring easing, or motion without a reduced-motion path.
- Mix font roles (e.g. body text in Space Grotesk).
- Redraw the logo or recolor it ad hoc.

**Where things live:** tokens + bespoke styling → `src/app/globals.css`;
copy/data → `src/lib/content.ts`; motion → `src/lib/useLandingMotion.ts`;
components → `src/components/`. See [`README.md`](./README.md) for the full map.
