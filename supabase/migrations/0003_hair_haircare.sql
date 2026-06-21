-- Haircare routine for the hair feature: stores the manual-form answers + the
-- generated tips on the user's hair_profiles row. Idempotent.
alter table public.hair_profiles add column if not exists haircare jsonb;
