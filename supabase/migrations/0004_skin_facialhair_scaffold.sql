-- Scaffold the skin + facial-hair features so they can be built in parallel
-- without each author writing conflicting migrations. Idempotent.

-- ============================================================
-- skin_profiles — align with the hair pattern (already has
-- skin_type, concerns text[], routine jsonb, data jsonb, updated_at).
-- Skin is routine-only: NO styles/previews table.
-- ============================================================
alter table public.skin_profiles add column if not exists scan_id uuid references public.scans(id) on delete set null;
alter table public.skin_profiles add column if not exists questionnaire jsonb;
alter table public.skin_profiles add column if not exists summary text;

-- ============================================================
-- facial_hair_profiles — align with hair (already has growth,
-- recommended_styles jsonb, data jsonb, updated_at).
-- ============================================================
alter table public.facial_hair_profiles add column if not exists scan_id uuid references public.scans(id) on delete set null;
alter table public.facial_hair_profiles add column if not exists questionnaire jsonb;
alter table public.facial_hair_profiles add column if not exists summary text;
alter table public.facial_hair_profiles add column if not exists density text;

-- ============================================================
-- facial_hair_styles — mirror of hair_styles (one row per
-- recommended beard style + its on-you preview).
-- ============================================================
create table if not exists public.facial_hair_styles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  scan_id       uuid references public.scans(id) on delete set null,
  slug          text,
  name          text not null,
  rationale     text,
  brief         text,
  full_brief    text,
  preview_path  text,
  status        text not null default 'pending',
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists facial_hair_styles_user_idx on public.facial_hair_styles(user_id, created_at desc);

-- RLS owner-only + updated_at trigger
alter table public.facial_hair_styles enable row level security;
drop policy if exists "facial_hair_styles_select_own" on public.facial_hair_styles;
create policy "facial_hair_styles_select_own" on public.facial_hair_styles for select using (auth.uid() = user_id);
drop policy if exists "facial_hair_styles_insert_own" on public.facial_hair_styles;
create policy "facial_hair_styles_insert_own" on public.facial_hair_styles for insert with check (auth.uid() = user_id);
drop policy if exists "facial_hair_styles_update_own" on public.facial_hair_styles;
create policy "facial_hair_styles_update_own" on public.facial_hair_styles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "facial_hair_styles_delete_own" on public.facial_hair_styles;
create policy "facial_hair_styles_delete_own" on public.facial_hair_styles for delete using (auth.uid() = user_id);

drop trigger if exists facial_hair_styles_set_updated_at on public.facial_hair_styles;
create trigger facial_hair_styles_set_updated_at before update on public.facial_hair_styles
  for each row execute function public.set_updated_at();
