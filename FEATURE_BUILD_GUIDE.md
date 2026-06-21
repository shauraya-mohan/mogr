# Feature Build Guide — parallel work without conflicts

Two features are being built **in parallel** by two people/agents:

- **Facial hair** → `facial-hair` namespace (mirrors the finished Hair feature)
- **Skin** → `skin` namespace (routine-only, **no image generation**)

The shared integration points are **already wired** (routes protected, dashboard
cards linked, preferences tabs delegated, DB tables created). If you stay inside
your namespace and follow this guide, you will not hit merge conflicts or break
the DB. Read this before writing code.

---

## 1. Golden rules

1. **Only edit files in your namespace** (see the ownership map). Do **not** edit
   any file in the "Shared — DO NOT EDIT" list — they're already done.
2. **Never edit or re-run an existing migration** (`0001`–`0004`). Your tables
   already exist. If you genuinely need a new column, add a *new* migration named
   `0005_<feature>_*.sql` (skin) / `0006_<feature>_*.sql` (facial-hair) so the
   numbers don't collide — agree who takes 0005 vs 0006 first.
3. **Reuse the shared libs, don't fork them**: `lib/openai.ts`,
   `lib/cacheKey.ts`, `lib/supabase/*`. Import them; never copy/modify.
4. **Match the design system** (`DESIGN.md`): bronze accent, mono labels, the
   bronze `.` device, `bg-cloud` cards, `var(--ink-08)` hairlines. Don't invent
   new colors/fonts.
5. **Commit on your own branch; push only when told.** Attribute to the
   `shauraya-mohan` account (already the git default).

---

## 2. File ownership map

### Facial-hair agent — create/own ONLY these
```
src/app/(console)/facial-hair/page.tsx        (replace the placeholder)
src/lib/facial-hair/content.ts
src/app/api/facial-hair/analyze/route.ts
src/app/api/facial-hair/preview/route.ts
src/components/facial-hair/FacialHairPreferences.tsx   (replace the stub)
src/components/facial-hair/*                   (any extra components)
supabase/migrations/0006_*.sql                 (only if you need MORE schema)
```

### Skin agent — create/own ONLY these
```
src/app/(console)/skin/page.tsx               (replace the placeholder)
src/lib/skin/content.ts
src/app/api/skin/analyze/route.ts             (NO preview route — no image gen)
src/components/skin/SkinPreferences.tsx       (replace the stub)
src/components/skin/*                          (any extra components)
supabase/migrations/0005_*.sql                 (only if you need MORE schema)
```

### Shared — DO NOT EDIT (already wired for both features)
```
src/lib/supabase/middleware.ts        /skin + /facial-hair already protected
src/app/(console)/dashboard/page.tsx  dashboard cards already link to both
src/components/dashboard/EditPreferences.tsx  tabs already delegate to your
                                              <SkinPreferences/> / <FacialHairPreferences/>
src/lib/openai.ts                     visionJSON / chatJSON / editImage
src/lib/cacheKey.ts                   canonical() for input-keyed caching
src/lib/supabase/{client,server}.ts   auth clients
src/components/Button.tsx, dashboard/icons.tsx, etc.
```
If you think you must change a shared file, stop and coordinate — there's almost
always a way to do it inside your namespace instead.

---

## 3. Your database is already created

All tables exist with **owner-only RLS** (`auth.uid() = user_id`). Don't migrate
them; just read/write.

**Skin** (`skin_profiles`, one row per user, PK `user_id`):
`skin_type`, `concerns text[]`, `routine jsonb`, `data jsonb`, `scan_id`,
`questionnaire jsonb`, `summary text`, `updated_at`. Store the routine in
`routine` (jsonb) and the questionnaire in `questionnaire`. No styles table.

**Facial hair** (`facial_hair_profiles`, one row per user, PK `user_id`):
`growth`, `recommended_styles jsonb`, `data jsonb`, `scan_id`,
`questionnaire jsonb`, `summary text`, `density text`, `updated_at`.
Plus **`facial_hair_styles`** (many per user) = exact mirror of `hair_styles`:
`id, user_id, scan_id, slug, name, rationale, brief, full_brief, preview_path,
status, sort_order, created_at, updated_at`.

**Shared, read/write freely:** `scans` (the selfie — `storage_path`, `kind`),
`profiles` (`face_shape`, `skin_undertone` are shared cross-feature reads),
`saved_looks` (gallery — `kind` distinguishes features), Storage bucket
`user-media` (`{userId}/scans/…`, `{userId}/previews/…`, owner-RLS).

---

## 4. The proven pattern — clone the Hair feature

Hair is finished and spec-complete. **Read these files; they are your template:**
```
src/lib/hair/content.ts                 questionnaire, copy, system prompts
src/app/api/hair/analyze/route.ts       vision read → persist → cache
src/app/api/hair/preview/route.ts       face-preserving image edit (facial hair only)
src/app/api/hair/haircare/route.ts       text-only generation + caching
src/app/(console)/hair/page.tsx          questionnaire → results UI
src/components/hair/HaircareSection.tsx  isolated sub-section pattern
```

### Facial hair = near-identical to hair
- Reuse `editImage()` for previews; change the prompt to preserve the face and
  edit **only the beard/stubble** (see `previewPrompt` in `lib/hair/content.ts`).
- Use `facial_hair_profiles` + `facial_hair_styles` instead of the hair tables.
- Generate previews at `quality: "low"` and pre-generate in the background
  (already the hair approach) to hide latency.

### Skin = different shape (NO image gen)
- Per PRD §5.1: scan + questionnaire → skin type + concerns → **AM/PM routine**
  with product *types* and ingredients (no brands) + encouraging coaching.
- Use **`chatJSON`** or **`visionJSON`** (vision is better — read the selfie),
  but there is **no `/preview` route and no `editImage`**. Output is text.
- Store routine in `skin_profiles.routine`, summary in `summary`.

---

## 5. Conventions (copy these exactly)

- **Auth in routes**: `const supabase = await createClient()` (from
  `@/lib/supabase/server`) → `supabase.auth.getUser()` → 401 if none. RLS does
  the rest; never use a service-role key client-side.
- **OpenAI**: server-only via `lib/openai.ts`. `visionJSON` (image + JSON),
  `chatJSON` (text + JSON), `editImage` (face-preserving edit). Models come from
  env (`OPENAI_VISION_MODEL`, `OPENAI_IMAGE_MODEL`) — don't hardcode.
- **Caching (required)**: import `canonical` from `@/lib/cacheKey`. Before calling
  a model, compare the request's inputs to the stored answers; if unchanged and a
  result exists, return it. Same inputs must yield the same result (see the hair
  analyze/haircare routes).
- **Selfie**: get the latest with
  `scans.select(...).eq('kind','selfie').order('created_at',{ascending:false}).limit(1)`.
  Download server-side with `supabase.storage.from('user-media').download(path)`.
- **Generated images**: store at `{userId}/previews/<uuid>.png`, save the path on
  the row, hand the client short-lived **signed URLs** (`createSignedUrl`).
- **Route config**: `export const runtime = "nodejs"` and a `maxDuration`
  (60 for vision/text, 120 for image edits).
- **Newer-scan + "previewed on you"** patterns: copy from the hair page.

---

## 6. Suggested split

- **Facial hair** → whoever wants the fast, proven path (it's a clone).
- **Skin** → whoever wants new ground (different output, no image gen).

Both can start immediately and in any order — the seams are already in place.
