# Mogr — Product Requirements Document (MVP)
 
**Product:** Mogr
**Type:** Web application
**Audience:** Men (16–35 primary)
**Positioning:** The one-stop grooming companion — "the Notion of grooming." Scan yourself, understand yourself, and groommax with personalized, AI-driven coaching across skin, hair, facial hair, and style.
**Document status:** v1 — MVP definition
**Author:** Founder
 
---
 
## 1. Overview
 
Mogr is a web app that uses a single selfie (camera or upload) plus light questionnaire input to give men personalized, actionable grooming guidance. Instead of forcing users to juggle a skincare app, a hairstyle app, a face-analysis app, and a styling tool, Mogr unifies everything into one profile that gets richer with every scan.
 
The core experience is built on **honest, encouraging coaching** — never a harsh numerical rating. Mogr tells you what's already working for you and what small changes would level you up, then shows you the result with face-preserving AI image generation.
 
The MVP ships four independent feature workflows. Each stands alone, but they share one underlying user profile (face shape, skin type, hair type, undertone) so the product compounds in value over time.
 
---
 
## 2. Goals & non-goals
 
### Primary goals
- Deliver genuinely useful, personalized grooming guidance from a single selfie + minimal questions.
- Show users a believable, face-preserving preview of recommended hair and facial-hair looks.
- Build a habit loop: users return to track changes and explore new looks.
- Establish a rich per-user grooming profile that becomes the product's moat.
### Non-goals (for MVP)
- No clinical or medical-grade skin diagnostics (we are a grooming coach, not a dermatologist).
- No quantitative attractiveness or "looks" score.
- No brand-specific product links or e-commerce in MVP.
- No body/fitness analysis in MVP.
- No social/community layer in MVP.
---
 
## 3. Target user
 
A man who wants to look and feel his best but finds grooming advice scattered, generic, or intimidating. He's comfortable online, influenced by social media, and wants clear, confidence-building direction — what suits *him* specifically, shown visually, with practical next steps he can actually act on.
 
---
 
## 4. Voice & tone principles (applies to every feature)
 
This is a product principle, not a nice-to-have. The entire reason Mogr can win where score-based apps generate backlash is its tone.
 
- **Always lead with a genuine strength.** Every result opens by pointing out something that already works for the user.
- **Frame improvements as upgrades, not flaws.** "Defining your jawline a touch more would sharpen your whole look" — never "your jaw is weak."
- **Qualitative, never quantitative.** No 1–10 scores, no rankings, no percentile comparisons.
- **Confident and motivating, age-appropriate, culturally current.** The user should close a result feeling capable and energized, not self-conscious.
- **Specific and actionable.** Every observation pairs with a concrete next step (a routine, a product type, a style to try).
---
 
## 5. MVP scope — feature workflows
 
Each of the four workflows below is a **separate feature** with its own entry point in the app. They share the underlying profile but are experienced independently. A user can do one without doing the others.
 
### 5.1 Skin scan → analysis → recommendations
 
**Input:** Selfie (camera or upload) + short questionnaire (skin feel through the day, current products used, key concerns, climate/city).
 
**Analysis (essential, non-clinical):** Identify skin type (oily / dry / combination / normal), visible texture, and common concerns relevant to grooming — oiliness/shine, dryness, dullness, breakouts, dark circles, uneven tone. We deliberately keep this to "groommax essentials" rather than clinical sub-metrics.
 
**Output:**
- Qualitative coaching summary (strengths first, then improvement areas).
- A simple, personalized AM/PM routine framed around product *types* and key *ingredients* (e.g. "a gentle gel cleanser," "a niacinamide serum for oil control," "a lightweight SPF"). **No brand links in MVP.**
- Practical habit tips tied to their inputs (e.g. blotting/SPF guidance for an oily-skin user in a humid city).
**Key constraint:** No image generation in this feature — skin is about routine, not visual preview.
 
---
 
### 5.2 Hair scan + questionnaire → recommended hairstyles + haircare tips
 
**Input:** Same selfie reused (no re-upload) + short questionnaire (hair length, texture, density, styling effort the user is willing to put in, maintenance preference).
 
**Analysis:** Detect face shape and current hair characteristics. Match to hairstyles that suit the user's face shape, hair type, and stated maintenance level.
 
**Output:**
- 3–5 recommended hairstyles, each with a short rationale ("this adds height to balance a rounder face").
- **Face-preserving AI image generation:** realistic previews of the user wearing each recommended style — it must look like *them*, not a generic model.
- Haircare tips matched to their hair type (routine, product types, styling guidance) — **product types, not brands, in MVP.**
- A barber brief: a shareable summary the user can show their barber describing the target style.
---
 
### 5.3 Facial hair scan → recommended styles + tips
 
**Input:** Same selfie reused (no re-upload) + light questionnaire (growth ability/patchiness, current length, maintenance preference).
 
**Analysis:** Use face shape and existing facial-hair coverage to recommend beard/stubble/mustache styles that balance the user's proportions and work with their actual growth pattern.
 
**Output:**
- Recommended facial-hair styles with rationale.
- **Face-preserving AI image generation:** realistic previews of each recommended style on the user's own face.
- Grooming and maintenance tips (trimming cadence, line-up guidance, beard-care product *types*) — **no brand links in MVP.**
---
 
### 5.4 Wardrobe styling
 
**Input:** User selects/uploads outfits they own (item-by-item, similar to existing wardrobe apps), plus the existing face/skin/hair profile.
 
**Analysis:** Combine the user's wardrobe items with their skin undertone and hair tone to generate styling guidance.
 
**Output:**
- **Color palette guidance:** flattering colors based on the user's skin undertone and hair tone, plus colors to approach with caution.
- **Outfit recommendations from owned items:** suggested combinations from the wardrobe the user uploaded, with rationale.
- **Fit guidance:** general fit-type suggestions (slim fit / straight fit / baggy / relaxed, etc.) based on what suits the user, framed generically rather than via body-measurement analysis in MVP.
**MVP boundary:** Recommendations are drawn from the user's *own* uploaded wardrobe plus general color/fit guidance. Recommending new items the user doesn't own, with shopping links, is **future** (see §6).
 
---
 
## 6. Future scope (explicitly out of MVP)
 
Flagged here so the team builds MVP without painting over these doors.
 
- **Teeth & smile feature** — a separate scan analyzing visible alignment, whitening opportunity, and smile symmetry, with whitening/care guidance. (Founder-confirmed: good idea, future.)
- **Brand-specific product links + affiliate integration** — across skin, hair, facial hair, and wardrobe. The recommendation engine in MVP already outputs product *types* and *ingredients*, so this is an additive layer: map those outputs to a real product catalog with shoppable, affiliate-tracked links.
- **No-wardrobe outfit recommendations** — recommend complete outfits the user doesn't own, filtered by preferred brands, price range, and style, with links to buy.
- **Progress tracking** — weekly skin/hair check-in photos with AI before/after comparison and routine adjustment.
- **Expansion features** (from earlier ideation) — color season analysis, eyebrow shaping, posture scan, fragrance profiling, scalp/hair-porosity analysis, body proportion analysis, seasonal routine switching.
- **Audience expansion** — potential unisex pivot once the male-focused MVP proves retention.
---
 
## 7. Shared system: the Mogr profile
 
Every feature reads from and writes to one evolving user profile. This is the strategic core — switching to a competitor means starting from zero.
 
Profile attributes built up across features:
- Face shape (from the first scan; reused everywhere).
- Skin type and concerns (from skin scan).
- Hair type, texture, density, length (from hair scan).
- Facial-hair growth pattern (from facial-hair scan).
- Skin undertone and hair tone (used in wardrobe styling).
- Wardrobe inventory (from wardrobe feature).
- Stated preferences (maintenance level, styling effort, climate/city).
**Critical UX rule:** the selfie is captured once and reused across skin, hair, and facial-hair features. Never make the user re-scan for each workflow.
 
---
 
## 8. Key technical considerations
 
- **Face-preserving image generation** is the highest-risk, highest-cost component. Identity consistency (the output genuinely looking like the user) is the make-or-break quality bar for the hair and facial-hair features. This needs early prototyping and a clear quality threshold before launch.
- **Face shape / feature detection** powers hair, facial hair, and wardrobe color guidance — build this once as a shared service.
- **Privacy is foundational, not a feature.** Facial scan data is highly sensitive. Requirements: a clear, plain-language data policy; minimize retention; process on-device where feasible; secure storage and transmission; and compliance with applicable data-protection law (including India's DPDP Act for the home market). A single mishandling incident can end the product.
- **Web platform:** camera capture quality and lighting guidance matter — provide an in-flow lighting/framing check before capture to improve analysis and generation quality.
- **Latency expectations:** set clear loading states for image generation, which is the slowest step.
---
 
## 9. Success metrics (MVP)
 
- **Activation:** % of new users who complete at least one full scan workflow.
- **Multi-feature adoption:** % of users who use 2+ of the four workflows (signals the unified-profile thesis is working).
- **Image-gen satisfaction:** thumbs-up rate / "looks like me" confirmation on generated hair and facial-hair previews.
- **Return rate:** 7-day and 30-day return rate.
- **Barber brief / share actions:** share events per active user (organic growth signal).
- **Recommendation usefulness:** explicit feedback on whether routine/style guidance felt personalized and actionable.
---
 
## 10. Open questions to resolve before build
 
1. What is the minimum acceptable quality bar for face-preserving generation, and how do we measure "looks like me"?
2. How many hairstyle and facial-hair style options does the recommendation library need at launch?
3. Do we gate any feature behind sign-up, or allow a first scan anonymously to reduce friction?
4. What is the monetization model for MVP (free with limits, subscription, one-time generation credits)? — needs a decision even if revenue features like affiliate links come later.
5. For wardrobe, what's the minimum number of uploaded items needed to produce a useful outfit recommendation?
---
 
## 11. One-line summary
 
Mogr is a men's grooming web app that turns a single selfie into personalized, encouraging coaching across skin, hair, facial hair, and style — and shows you the upgraded version of yourself with face-preserving AI — all building one profile that gets smarter every time you use it.
 