-- mogr — Phase 0 for the feature layers: private media storage + scan records,
-- plus the hair-feature tables. Idempotent.

-- ============================================================
-- Private storage bucket for selfies + generated previews.
-- Layout: {user_id}/scans/<uuid>.jpg, {user_id}/previews/<uuid>.png
-- ============================================================
insert into storage.buckets (id, name, public)
values ('user-media', 'user-media', false)
on conflict (id) do nothing;

-- Owner-only access: the first path segment must equal the user's id.
drop policy if exists "user_media_select_own" on storage.objects;
create policy "user_media_select_own" on storage.objects for select
  using (bucket_id = 'user-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "user_media_insert_own" on storage.objects;
create policy "user_media_insert_own" on storage.objects for insert
  with check (bucket_id = 'user-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "user_media_update_own" on storage.objects;
create policy "user_media_update_own" on storage.objects for update
  using (bucket_id = 'user-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "user_media_delete_own" on storage.objects;
create policy "user_media_delete_own" on storage.objects for delete
  using (bucket_id = 'user-media' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- scans — a captured selfie. Shared across skin/hair/beard features.
-- ============================================================
create table if not exists public.scans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  storage_path  text not null,
  kind          text not null default 'selfie',
  created_at    timestamptz not null default now()
);
create index if not exists scans_user_idx on public.scans(user_id, created_at desc);

-- ============================================================
-- hair_profiles — extend with the questionnaire + read.
-- (table already exists from 0001)
-- ============================================================
alter table public.hair_profiles add column if not exists scan_id uuid references public.scans(id) on delete set null;
alter table public.hair_profiles add column if not exists questionnaire jsonb;
alter table public.hair_profiles add column if not exists summary text;
alter table public.hair_profiles add column if not exists density text;
alter table public.hair_profiles add column if not exists length text;

-- ============================================================
-- hair_styles — one row per recommended style + its on-you preview.
-- ============================================================
create table if not exists public.hair_styles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  scan_id       uuid references public.scans(id) on delete set null,
  slug          text,
  name          text not null,
  rationale     text,
  brief         text,          -- quick barber brief (one or two lines)
  full_brief    text,          -- expanded barber brief
  preview_path  text,          -- storage path of the generated on-you image
  status        text not null default 'pending',  -- pending | ready | failed
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists hair_styles_user_idx on public.hair_styles(user_id, created_at desc);

-- ============================================================
-- saved_looks — shared "your looks" gallery (any feature can save here).
-- ============================================================
create table if not exists public.saved_looks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  kind        text not null default 'hair',  -- hair | facial_hair | wardrobe | ...
  ref_id      uuid,                          -- e.g. the hair_styles.id it came from
  title       text,
  image_path  text,
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists saved_looks_user_idx on public.saved_looks(user_id, created_at desc);

-- ============================================================
-- RLS (owner-only) + updated_at trigger
-- ============================================================
do $$
declare t text;
begin
  foreach t in array array['scans','hair_styles','saved_looks']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "%1$s_select_own" on public.%1$I;', t);
    execute format('create policy "%1$s_select_own" on public.%1$I for select using (auth.uid() = user_id);', t);
    execute format('drop policy if exists "%1$s_insert_own" on public.%1$I;', t);
    execute format('create policy "%1$s_insert_own" on public.%1$I for insert with check (auth.uid() = user_id);', t);
    execute format('drop policy if exists "%1$s_update_own" on public.%1$I;', t);
    execute format('create policy "%1$s_update_own" on public.%1$I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
    execute format('drop policy if exists "%1$s_delete_own" on public.%1$I;', t);
    execute format('create policy "%1$s_delete_own" on public.%1$I for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;

drop trigger if exists hair_styles_set_updated_at on public.hair_styles;
create trigger hair_styles_set_updated_at before update on public.hair_styles
  for each row execute function public.set_updated_at();
