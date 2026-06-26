-- Skin shade on the shared profile. Read from the skin scan (cosmetic
-- complexion-depth, e.g. Fair/Light/Medium/Tan/Deep — never ethnicity/clinical)
-- and reused cross-feature, alongside the existing face_shape + skin_undertone.
-- The skin-analysis route writes it; the dashboard (and future wardrobe) read it.
-- Owner-only RLS on profiles already covers this column. Idempotent.
alter table public.profiles add column if not exists skin_shade text;
