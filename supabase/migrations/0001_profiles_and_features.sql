-- mogr — initial schema
-- One shared identity table (profiles) + one table per feature, all owned by
-- the auth user and protected by row-level security (owner-only access).
-- Idempotent: safe to re-run.

-- ============================================================
-- profiles — shared identity (name, age, + cross-feature reads)
-- One row per auth user. Populated at signup from user metadata.
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  age         int check (age is null or (age >= 13 and age <= 120)),
  -- shared, scan-derived attributes reused across features (PRD §7)
  face_shape      text,
  skin_undertone  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ============================================================
-- Auto-create a profile row on signup, pulling name/age from
-- the signUp() metadata (raw_user_meta_data).
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, age)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'age', '')::int
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: ensure every existing auth user has a profile row.
insert into public.profiles (id)
  select id from auth.users
  on conflict (id) do nothing;

-- ============================================================
-- keep updated_at fresh
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- Per-feature tables (one row per user; the latest read)
-- ============================================================
create table if not exists public.skin_profiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  skin_type   text,
  concerns    text[],
  routine     jsonb,
  data        jsonb,
  updated_at  timestamptz not null default now()
);

create table if not exists public.hair_profiles (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  hair_type           text,
  recommended_styles  jsonb,
  data                jsonb,
  updated_at          timestamptz not null default now()
);

create table if not exists public.facial_hair_profiles (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  growth              text,
  recommended_styles  jsonb,
  data                jsonb,
  updated_at          timestamptz not null default now()
);

-- Wardrobe is one-to-many (a user owns many items).
create table if not exists public.wardrobe_items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category    text,
  name        text,
  color       text,
  image_url   text,
  data        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists wardrobe_items_user_idx on public.wardrobe_items(user_id);

-- RLS (owner-only) for every feature table + updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['skin_profiles','hair_profiles','facial_hair_profiles','wardrobe_items']
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

  foreach t in array array['skin_profiles','hair_profiles','facial_hair_profiles']
  loop
    execute format('drop trigger if exists %1$s_set_updated_at on public.%1$I;', t);
    execute format('create trigger %1$s_set_updated_at before update on public.%1$I for each row execute function public.set_updated_at();', t);
  end loop;
end $$;
