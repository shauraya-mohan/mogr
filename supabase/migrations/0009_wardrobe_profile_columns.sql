-- mogr — wardrobe recommendation prerequisites
-- Renames skin_undertone → undertone (was never written; quiz is the source
-- of truth per the recommendation plan), adds palette columns, hair_tone,
-- and the outfit table. Idempotent.

-- ============================================================
-- Rename skin_undertone → undertone (safe; column was never populated)
-- ============================================================
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
      and column_name = 'skin_undertone'
  ) then
    alter table public.profiles rename column skin_undertone to undertone;
  end if;
end $$;

-- ============================================================
-- New columns on profiles
-- ============================================================
alter table public.profiles add column if not exists undertone_source       text;          -- quiz | inferred
alter table public.profiles add column if not exists palette                jsonb;         -- built lazily (§7.3)
alter table public.profiles add column if not exists palette_generated_at   timestamptz;
alter table public.profiles add column if not exists hair_tone              text;          -- from hair scan; palette input

-- ============================================================
-- outfit — one row per stylist response the user keeps
-- ============================================================
create table if not exists public.outfits (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  occasion            text,
  styling_intent      jsonb,
  mode                text,                 -- closet_only | hybrid
  item_ids            uuid[],
  outside_items       jsonb,
  render_mode         text,                 -- mannequin | flatlay
  rendered_image_url  text,
  title               text,
  rationale           text,
  color_rationale     text,
  fit_note            text,
  gaps                jsonb,
  saved               boolean not null default false,
  created_at          timestamptz not null default now()
);
create index if not exists outfits_user_idx on public.outfits(user_id, created_at desc);

-- RLS: owner-only
alter table public.outfits enable row level security;
drop policy if exists "outfits_select_own" on public.outfits;
create policy "outfits_select_own" on public.outfits
  for select using (auth.uid() = user_id);
drop policy if exists "outfits_insert_own" on public.outfits;
create policy "outfits_insert_own" on public.outfits
  for insert with check (auth.uid() = user_id);
drop policy if exists "outfits_update_own" on public.outfits;
create policy "outfits_update_own" on public.outfits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "outfits_delete_own" on public.outfits;
create policy "outfits_delete_own" on public.outfits
  for delete using (auth.uid() = user_id);
