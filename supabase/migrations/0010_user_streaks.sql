-- user_streaks — one row per user tracking their grooming-routine streak.
-- A day counts as "locked in" once every pinned routine_step is completed_on
-- today. current_streak increments by 1 when today follows yesterday's
-- locked-in day; any gap resets it back to 1 on the next locked-in day
-- (never drops to 0 — see src/lib/streak/content.ts for the exact rule).
-- Owner-only RLS. Idempotent.
create table if not exists public.user_streaks (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  current_streak    int not null default 0,
  last_completed_on date,
  updated_at        timestamptz not null default now()
);

alter table public.user_streaks enable row level security;
drop policy if exists "user_streaks_select_own" on public.user_streaks;
create policy "user_streaks_select_own" on public.user_streaks
  for select using (auth.uid() = user_id);
drop policy if exists "user_streaks_insert_own" on public.user_streaks;
create policy "user_streaks_insert_own" on public.user_streaks
  for insert with check (auth.uid() = user_id);
drop policy if exists "user_streaks_update_own" on public.user_streaks;
create policy "user_streaks_update_own" on public.user_streaks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists user_streaks_set_updated_at on public.user_streaks;
create trigger user_streaks_set_updated_at before update on public.user_streaks
  for each row execute function public.set_updated_at();
