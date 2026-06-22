# Mogr — Skin Analysis (Path A) — Implementation Brief

**For:** the engineer/agent building this feature
**Product:** Mogr, a men's grooming web app ("groommax"). This document specifies the **skin analysis** feature only.
**Approach:** "Path A" — a vision-language-model (VLM) based pipeline. No custom ML training, no datasets. Ship-ready for MVP.

---

## 1. What we are building

A web flow where a user scans their face (camera or photo upload), and we return a personalised, **non-clinical** skin read plus an actionable skincare routine, written in an encouraging coaching tone. The actual "seeing" is done by a vision model (Gemini Flash, GPT-4o, or Claude with vision). Our job is to (a) get a clean, well-framed, well-lit face image to that model, (b) prompt it correctly, (c) fuse its read with the user's questionnaire answers, and (d) turn the result into a routine and coaching copy.

**This is grooming guidance, not dermatology.** We make no medical claims and never diagnose disease.

---

## 2. Hard product rules (these are non-negotiable)

1. **No numeric scores anywhere.** No "skin score," no 0–100, no percentages, no grades. Everything is qualitative.
2. **Coaching tone, strengths first.** Every result opens with something that's genuinely working for the user, then frames improvements as upgrades ("dialing in X would sharpen things"), never as flaws.
3. **Coarse buckets only.** Severity is `none | mild | moderate | strong | unclear`. Skin type is a small fixed set. Never finer than that.
4. **The model may abstain.** Any attribute it cannot actually see must come back as `unclear` / `visible: false`. We never force a confident value.
5. **No brand or product links in MVP.** Routines recommend **product *types* and key *ingredients*** only (e.g. "a gentle gel cleanser," "a niacinamide serum"). Brand-specific recommendations and shoppable links are a **future** feature — leave the data model able to attach them later, but do not implement them now.
6. **Male-focused** audience; copy should read naturally for that audience.

---

## 3. Scope

**In scope (build this):**
- Client-side capture + face/quality gating with MediaPipe.
- Image pre-processing (crop, white-balance normalisation).
- A VLM analysis call returning strict JSON.
- Questionnaire fusion.
- Routine + coaching-copy generation.

**Out of scope (do NOT build now):**
- Fine-grained concerns that need true pixel detail — **pore size, fine lines/wrinkles, fine texture**. VLMs cannot see these reliably; they will be handled later by a separate CV pipeline ("Path B") with segmentation models and heatmap overlays. For now, omit them entirely rather than guessing.
- Any medical/disease detection.
- Numeric scoring.
- Progress tracking / before-after (future; see note in §10).
- Hair, facial hair, wardrobe (separate features).

---

## 4. The pipeline (end to end)

```
[1] Capture (camera or upload)
        │
        ▼
[2] Client-side gate (MediaPipe)  ── fails → guide user to retry (never sends a bad image)
        │  face present? exactly one? front-facing & upright? well-lit? sharp?
        ▼
[3] Pre-process: crop to face region, normalise white balance
        │
        ▼
[4] VLM analysis call (server-side)  → strict JSON read (zone-by-zone, coarse, may abstain)
        │  (run 2–3× for severity self-consistency; see §7)
        ▼
[5] Fuse with questionnaire answers → finalised skin read
        │
        ▼
[6] Generate routine (product types + ingredients) + coaching copy (brand voice)
        │
        ▼
[7] Return to UI
```

---

## 5. Stage 2 — Capture + quality gate (MediaPipe, client-side)

Runs entirely in the browser. Purpose: never spend a paid VLM call on an unusable image, and keep rejected images on-device (privacy).

Use **MediaPipe Face Detection** and **MediaPipe Face Mesh** (468 landmarks). Requirements:

- **Capture from the live video stream via `getUserMedia` + canvas**, not the native camera app, to avoid the phone's automatic beauty-smoothing/HDR retouching. If upload is used instead, warn the user to avoid beauty-mode photos.
- **Face presence:** exactly one face must be detected. Zero or multiple → block with a clear message.
- **Pose check:** use Face Mesh landmarks to estimate head yaw/pitch/roll. Require roughly front-facing and upright (define tolerances, e.g. within ~±15°). Out of range → prompt "face the camera straight on."
- **Lighting/quality gate, measured on the face region only** (you have the landmarks, so mask to skin pixels): reject if too dark, blown-out/overexposed, harsh uneven side-lighting, or blurry (e.g. low Laplacian variance). Give a specific reason each time ("too dark — find better light").
- Only when all checks pass do we proceed to capture and send.

The gate must produce a **specific, friendly reason** on failure so the UI can coach the retake. This "line up your face in good light" step is exactly what the commercial tools enforce, and it is the single biggest lever on output quality.

**MediaPipe does NOT analyse skin.** It only provides geometry, framing, and lighting checks. All skin judgement is the VLM's job.

---

## 6. Stage 3 — Pre-processing

- **Crop** to a consistent, tight bounding box around the face using the landmarks (some forehead and chin margin). This reduces irrelevant pixels (cheaper, more accurate calls) and — important for future progress tracking — frames every scan consistently.
- **Normalise white balance / exposure** on the cropped face (e.g. gray-world or a simple WB correction) so lighting varies less between users and sessions.
- Send only this processed crop to the model. Do not send the full selfie.

---

## 7. Stage 4 — VLM analysis call (server-side)

Send the processed crop **plus the user's questionnaire answers** to the vision model.

**Consistency requirements (all MUST be implemented):**
- **Temperature 0**, fixed prompt, pinned model version.
- **Self-consistency:** run the analysis call **2–3 times** and take the **majority/median** severity per concern. Variance between runs is expected; this damps it.
- **Zone-by-zone:** instruct the model to assess regions separately (forehead, nose, cheeks, chin → T-zone vs U-zone), not one global glance. This both improves the skin-type inference and stabilises it.
- **Abstention:** the model must mark anything it can't actually see as `unclear` / `visible: false`. Forbid it from inventing values.
- **Strict JSON output**, no prose, matching the schema in §8.

### The analysis prompt (use as the system/instruction prompt)

```
You are a grooming skin-analysis assistant for a men's grooming app. You assess
visible, surface-level skin characteristics from a single face photo to support
grooming and skincare-routine suggestions. You are NOT a doctor and must not
diagnose any medical or skin condition.

You are given: (1) a cropped, front-facing face photo, and (2) the user's
self-reported questionnaire answers.

Assess ONLY these surface characteristics, region by region (forehead, nose,
cheeks, chin; summarise as T-zone and U-zone):
- skin type (dry, oily, combination, normal)
- oiliness / shine
- dryness / flaking
- visible breakouts / acne (presence only — do not count or diagnose)
- dark circles / under-eye shadows
- redness
- dullness / lack of radiance
- uneven tone

RULES:
- Use ONLY these severity values: none, mild, moderate, strong, unclear.
- If you cannot clearly see a characteristic in the image, return "unclear" and
  set visible=false. Do NOT guess or invent. It is correct and expected to
  return "unclear" often for subtle things.
- Do NOT assess pore size, fine lines, wrinkles, or fine texture — these cannot
  be judged reliably from this image; omit them.
- Do NOT give numeric scores, ratings, percentages, or an overall grade.
- Consider the questionnaire answers when deciding skin type and severities,
  especially where the image is ambiguous (self-report on skin behaviour is
  reliable).
- Be calibrated and neutral; do not flatter and do not alarm.
- Output STRICT JSON only, matching the provided schema. No commentary.
```

Pass the questionnaire answers in the user message alongside the image, e.g. a short structured block (skin feel through the day, breakout frequency, current products, climate/city, known sensitivities).

---

## 8. Output schema (strict JSON contract)

The analysis call returns exactly this shape. The downstream routine/copy step consumes it.

```json
{
  "faceDetected": true,
  "imageUsable": true,
  "skinType": {
    "value": "combination",            // dry | oily | combination | normal
    "confidence": "medium",            // low | medium | high
    "basis": "fused"                   // image | questionnaire | fused
  },
  "concerns": [
    {
      "id": "oiliness",                // stable id
      "label": "Oiliness / shine",
      "severity": "moderate",          // none | mild | moderate | strong | unclear
      "visible": true,
      "regions": ["t_zone"]            // forehead | nose | cheeks | chin | under_eyes | t_zone | u_zone
    },
    {
      "id": "dryness",       "label": "Dryness", "severity": "mild",    "visible": true,  "regions": ["cheeks"] },
    { "id": "breakouts",     "label": "Breakouts", "severity": "mild",  "visible": true,  "regions": ["chin"] },
    { "id": "dark_circles",  "label": "Dark circles", "severity": "moderate", "visible": true, "regions": ["under_eyes"] },
    { "id": "redness",       "label": "Redness", "severity": "unclear", "visible": false, "regions": [] },
    { "id": "dullness",      "label": "Dullness", "severity": "mild",   "visible": true,  "regions": ["cheeks"] },
    { "id": "uneven_tone",   "label": "Uneven tone", "severity": "unclear", "visible": false, "regions": [] }
  ],
  "zoneSummary": {
    "t_zone": "looks oilier, some shine",
    "u_zone": "slightly dry on the cheeks"
  }
}
```

Notes:
- After self-consistency runs, store the **majority severity** per concern.
- Concerns with `visible: false` / `unclear` should be **de-emphasised or hidden** in the UI, not presented as findings.

---

## 9. Stage 6 — Routine + coaching generation

A second step (can be a separate, text-only LLM call) takes the finalised read + questionnaire and produces the routine and copy. Keeping this separate from the vision call is cleaner and lets you use a cheaper text model.

**Routine output:**
- A simple **AM** and **PM** routine.
- Each step is a **product *type* + the key *ingredient/benefit*** — e.g. "Gentle gel cleanser," "Niacinamide serum (helps with oil/shine)," "Lightweight moisturiser," "SPF 50 (non-negotiable in the morning)."
- **No brands, no links.** Structure the routine items so a `product`/`link` field can be attached later (future), but leave them null now.
- Tailor to the read + questionnaire (e.g. oily T-zone + humid city → oil-control and SPF emphasis; dryness → richer moisturiser).

**Coaching copy rules (brand voice):**
- Open with a genuine strength ("Clear skin and an even tone — that's working for you").
- Frame improvements as upgrades, not flaws.
- Specific and actionable; tie each observation to a step.
- No scores, no medical claims, calibrated (don't over-praise, don't alarm).
- Confident, motivating, age-appropriate for a male audience.

---

## 10. Reliability checklist (must all be true)

- [ ] Bad/dark/blurry/angled/multi-face images are blocked client-side with a specific reason; no VLM call is made.
- [ ] Frames captured from the video stream (not native camera app) to dodge beauty-smoothing; upload path warns about beauty mode.
- [ ] Face crop + white-balance normalisation applied before sending.
- [ ] Temperature 0, pinned model + prompt.
- [ ] Analysis run 2–3× with majority/median severity.
- [ ] Model assesses zone-by-zone and may return `unclear`.
- [ ] Skin type fuses image + questionnaire.
- [ ] Pores / fine lines / fine texture are omitted (not guessed).
- [ ] Output is strict JSON matching the schema; invalid JSON is rejected/retried.
- [ ] No numeric scores produced anywhere.

**Forward note (do not build yet):** When progress tracking is added later, do NOT diff two independent analysis results — run-to-run noise will swamp real change and fake "improvements." Instead, send both the old and new photo to the model in a single comparison call and ask what changed. Relative comparison is far more stable than comparing two absolute reads. Keep this in mind so today's data model stores the (consented) cropped image to enable that later.

---

## 11. Privacy

- Do all gating client-side; rejected images never leave the device.
- Send only the cropped, consented face image to the server/model.
- Get explicit consent before any face image is processed or stored.
- Minimise retention; store only what's needed (and only if the user enables history/future progress tracking).
- Follow applicable data-protection law (incl. India's DPDP Act). Face data is sensitive; treat a breach as existential.

---

## 12. Suggested stack

- **Client:** MediaPipe Face Detection + Face Mesh (JS), `getUserMedia` + canvas for capture, in-browser brightness/blur checks.
- **Server:** Python (FastAPI) or Node — your choice.
- **Vision model:** Gemini Flash, GPT-4o, or Claude (vision), structured-output / JSON mode, temperature 0.
- **Copy/routine model:** any capable text LLM (can be cheaper than the vision model).

---

## 13. Acceptance criteria

1. A clean, well-lit front-facing scan returns a sensible read + an AM/PM routine of product types/ingredients + strengths-first coaching copy, with no numeric scores.
2. A dark / blurry / angled / no-face / multi-face capture is rejected client-side with a clear, specific retry message and triggers no VLM call.
3. Re-scanning the same good photo yields stable results (no jarring flip-flops in skin type or major concerns) thanks to coarse buckets + self-consistency + questionnaire fusion.
4. Subtle attributes the model can't see come back as `unclear` and are not surfaced as findings.
5. Pores, fine lines, and fine texture do not appear in output.
6. No brand names or purchase links appear anywhere.
```
