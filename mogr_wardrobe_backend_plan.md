# Mogr — Wardrobe Feature — Backend Plan

**For:** the engineer/agent building the wardrobe backend.
**Product:** Mogr, a men's grooming web app. This document specifies the **wardrobe** feature's backend only (capture → cutout → tagging → storage → outfit recommendation). UI is specced separately.

---

## 1. What this feature does

The user scans clothes they own — **one garment at a time**. Each garment is turned into a clean, consistent **ghost-mannequin image** (Photoroom), then **tagged** with structured attributes (a vision model). Items are stored in the user's wardrobe. When the user wants an outfit, they give an **occasion input** (preset chips + a free-text prompt), and a **stylist model** assembles complete outfits from the items they own, fused with their **skin undertone and hair tone** (pulled from their Mogr profile), with a short coaching-tone rationale and a colour rationale.

**MVP boundary:** outfits are built from **owned items only**, plus general colour/fit guidance. Recommending *new* items the user doesn't own, and shoppable **brand links**, are **future** — leave the data model room for them but do not implement now.

---

## 2. Product rules to respect (consistency with the rest of Mogr)

1. **No numeric scores** — outfit quality is expressed as qualitative rationale, never a rating.
2. **Coaching tone** in all copy — confident, encouraging, male-focused; explain *why* a fit works.
3. **Owned items only** for MVP outfits.
4. **No brand names / no purchase links** yet (future). Data model may reserve fields; pipeline must not populate them.
5. **Colour guidance is tied to the user's undertone + hair tone**, not generic.
6. Privacy: garment images are user data; store securely, tie to user, allow deletion.

---

## 3. Chosen external services (locked)

- **Cutout / ghost mannequin:** **Photoroom API** — Image Editing API (Ghost Mannequin) for the primary look; Remove Background API as the cheap fallback / plain-cutout option.
  - Ghost mannequin ≈ $0.10/image (Plus/Image-Editing tier); plain cutout ≈ $0.02/image (Basic). One Plus subscription can make both call types.
  - Failed calls don't consume credits. Build in retry.
- **Tagging, occasion refinement, and styling:** a single **vision-language model** (standardise on the same model used elsewhere in Mogr — e.g. Gemini Flash / Flash-Lite, GPT-4o-mini, or Claude Haiku). No specialised fashion-tagging vendor for MVP.
- **Image storage:** object storage (S3 / GCS / R2). Store the cutout; optionally keep the original.
- **DB:** relational (Postgres recommended).
- **Async processing:** a job queue (the cutout + tag pipeline takes several seconds; don't block the upload request).

---

## 4. End-to-end pipeline

```
[Capture] user photographs ONE garment (camera/upload)
     │  light client check: single item, not blurry, not too dark
     ▼
[Upload]  POST garment → store original → enqueue processing job → return {itemId, status: "processing"}
     │        (UI shows a processing placeholder; polls or subscribes for completion)
     ▼
[Cutout]  Photoroom Ghost Mannequin  → clean mannequin PNG  (fallback: Remove Background plain cutout)
     │        store cutout image → itemId.imageUrl
     ▼
[Tag]     VLM on the cutout → strict JSON attributes (category, colours+hex, formality, fit, ...)
     │        also flags "not a garment" / "unclear"
     ▼
[Store]   write attributes to the wardrobe item → status: "ready"
     ▼
        (item now appears in the user's wardrobe)

── later, on demand ──

[Occasion] user picks chips + types free text
     │
     ▼
[Refine]  cheap LLM normalises free text → structured styling intent (occasion, vibe, constraints)
     │
     ▼
[Style]   stylist model: user's tagged items + skin undertone + hair tone + intent + colour palette
     │        → 1–3 complete outfits from OWNED items, each with rationale + colour rationale + fit note
     ▼
[Return]  outfits to UI (user can save)
```

Steps **Cutout** and **Tag** run **once per item** and are cached forever (never re-tag or re-cutout an existing item). Only **Refine + Style** run per outfit request.

---

## 5. Stage detail

### 5.1 Capture & upload
- One garment per photo. A light client-side sanity check (not blurry, reasonably lit, one main object) is enough — no MediaPipe (that's for faces).
- `POST /wardrobe/items` stores the original, creates an item row with `status: "processing"`, enqueues a job, and returns immediately. The UI must not block.

### 5.2 Cutout (Photoroom)
- Primary: **Ghost Mannequin** (Image Editing API) for a consistent "worn" look across the wardrobe grid.
- Fallback: **Remove Background** (plain transparent cutout) if the mannequin call fails, if the item type isn't mannequin-suitable (e.g. accessories, shoes), or as a cost lever later.
- Retry on transient failure (failed calls don't cost credits). Store the resulting PNG in object storage; save the URL on the item.
- Cache: never re-run for an existing item.

### 5.3 Tagging (VLM)
- Input: the **clean cutout** (background noise already removed → better accuracy).
- Output: **strict JSON** to the schema in §6. Temperature 0, pinned model + prompt, JSON mode. Validate; retry once on invalid JSON.
- The tagging call must also be able to return **`isGarment: false`** (user photographed something that isn't clothing) so the pipeline can reject gracefully, and use **`unclear`** for any attribute it can't determine (same abstention rule as the skin scan).
- Emphasise **colours with HEX values** — these drive palette matching and are the most important field.

### 5.4 Occasion refinement
- **Preset chips** (Casual, Work, Smart casual, Going out, Date, Formal, Athletic) map to canned structured intents.
- **Free-text prompt** → a cheap LLM call normalises it into a structured `stylingIntent` (occasion, vibe/keywords, any constraints like weather or "no bright colours"). Chips + refined text merge into one intent object.

### 5.5 Colour palette (deterministic)
- Derive the user's flattering palette from **skin undertone (warm / cool / neutral)** + **hair tone** using a **rules/lookup table**, not a model call — this keeps the palette **stable and consistent** (a user should always see the same palette). Output: a set of recommended colours (with hex) and a small "approach with caution" set.
- This palette (a) powers the standalone "your colours" display and (b) is passed into the stylist so it prefers in-palette items.

### 5.6 Stylist / recommendation (VLM/LLM)
- **Inputs:** the user's tagged wardrobe items **as structured text** (the tags carry what's needed — sending images is unnecessary and costlier; optionally attach a few thumbnails only if a chosen VLM benefits), the user's **undertone + hair tone + derived palette**, and the **stylingIntent**.
- **Task:** assemble **1–3 complete outfits** from **owned items only**, each honouring basic styling logic (formality match to occasion, colour harmony against the user's palette, sensible proportions/fit). Each outfit returns: the item IDs used, a short **rationale**, a **colour rationale** tied to the user's tone, and a **fit note**.
- **Guardrails:** owned items only; if the wardrobe can't form a complete outfit for the occasion, return a **`gaps`** list naming the missing generic piece type (e.g. "a pair of dark trousers") — this is the seam where **future** buyable recommendations/links attach, but for MVP just surface the gap as advice, no products/links.
- **Output:** strict JSON (see §6). Low temperature, validated.

---

## 6. Data model & contracts

### WardrobeItem
```json
{
  "id": "itm_123",
  "userId": "usr_1",
  "status": "ready",                 // processing | ready | failed | rejected
  "imageUrl": "https://.../cutout.png",
  "originalUrl": "https://.../orig.jpg",
  "isGarment": true,
  "category": "top",                 // top | bottom | outerwear | footwear | accessory
  "subtype": "overshirt",
  "colors": [ { "name": "olive", "hex": "#6B6F47" } ],   // dominant first
  "pattern": "solid",                // solid | striped | checked | printed | textured | unclear
  "formality": "smart casual",       // casual | smart casual | formal | athletic | unclear
  "fit": "relaxed",                  // slim | regular | relaxed | oversized | unclear
  "season": ["spring", "autumn"],
  "materialLook": "cotton twill",
  "occasions": ["work", "everyday"],
  "createdAt": "..."
}
```

### Tagging call output (subset written onto the item)
Same attribute fields as above, plus `isGarment` and per-field `unclear` allowance.

### StylingIntent (from chips + refined text)
```json
{ "occasion": "date", "vibe": ["smart", "understated"], "constraints": ["cooler weather"] }
```

### Outfit (generated)
```json
{
  "id": "fit_9",
  "userId": "usr_1",
  "occasion": "date",
  "itemIds": ["itm_123", "itm_456", "itm_789"],
  "rationale": "Clean, understated, and easy to wear...",
  "colorRationale": "Earthy olive and off-white lean into your warm undertone.",
  "fitNote": "Keep the overshirt relaxed over a fitted tee for balance.",
  "gaps": [],                        // e.g. ["a pair of clean white sneakers"] — MVP: advice only
  "buyable": [],                     // FUTURE: populated with product suggestions + links
  "saved": false,
  "createdAt": "..."
}
```

### User profile fields consumed (from other Mogr scans)
`skinUndertone (warm|cool|neutral)`, `skinShade`, `hairTone/colour`.

---

## 7. Backend endpoints (suggested)

- `POST /wardrobe/items` — upload one garment; returns `{itemId, status:"processing"}`; triggers async cutout+tag.
- `GET /wardrobe/items` — list the user's items (filter by category/status).
- `GET /wardrobe/items/:id` — single item (for polling status).
- `PATCH /wardrobe/items/:id` — edit tags (user correction) / re-cutout toggle.
- `DELETE /wardrobe/items/:id`.
- `GET /wardrobe/palette` — the user's derived colour palette.
- `POST /wardrobe/outfits` — body: `{ chips: [...], prompt: "..." }` → refine → style → returns 1–3 outfits.
- `POST /wardrobe/outfits/:id/save` — save a generated outfit.
- `GET /wardrobe/outfits` — saved outfits.

---

## 8. Edge cases & guardrails

- **Not a garment:** tagging returns `isGarment:false` → item `status:"rejected"`, UI asks for a clothing photo. No credits wasted beyond the one tag call.
- **Cutout failure:** retry; if it keeps failing, fall back to plain Remove Background; if that fails, `status:"failed"` with a retry option.
- **Sparse wardrobe:** define a **minimum to generate an outfit** (e.g. at least one top + one bottom + footwear). Below that, prompt the user to add items rather than returning a weak outfit.
- **Ambiguous attributes:** allow `unclear`; the stylist should tolerate missing fields.
- **Consistency:** tag each item once and store; palette is deterministic; stylist runs at low temperature.
- **Cost control:** cutout + tag once per item (cached); stylist on demand with light caching of recent requests; never re-tag.

---

## 9. Cost shape (planning)

- Cutout: ghost mannequin ≈ $0.10/item, or plain cutout ≈ $0.02/item (both one-time per item). Self-hosted removal (rembg/BiRefNet) is a later cost-reduction option.
- Tagging: a VLM call ≈ sub-cent per item (one-time).
- Refine + Style: a few cents per outfit request.
- Net: **low single-digit cents per user** in typical use. The dime-per-mannequin only matters at scale → then shift some items to plain cutout / self-hosted.

---

## 10. Build order

1. **Ingestion + Cutout + Tagging + storage** — get clean, tagged items into a wardrobe. (Core; nothing works without it.)
2. **Wardrobe listing + edit/delete** — user can see and correct their closet.
3. **Colour palette derivation** — deterministic table from undertone + hair.
4. **Occasion input + refinement + Stylist** — outfit generation from owned items.
5. **Save outfits.**
6. **(Future)** gap-filling with buyable suggestions + affiliate links; virtual try-on is explicitly out.

---

## 11. Explicitly OUT of scope (MVP)

- Recommending / linking items the user doesn't own (future).
- Brand names and shoppable links (future).
- Virtual try-on (rejected — accuracy too low).
- Multi-garment / full-outfit-in-one-photo auto-separation (capture is one item at a time).
- Body-measurement analysis.

---

## 12. Open decisions

1. Which VLM to standardise on (should match the other Mogr scans).
2. Ghost mannequin for all categories, or plain cutout for footwear/accessories (likely mannequin for garments, cutout for the rest).
3. Exact minimum-wardrobe threshold to allow outfit generation.
4. How many outfits to return per request (recommend 1–3).
5. Whether users can manually correct tags (recommended — improves stylist quality).
