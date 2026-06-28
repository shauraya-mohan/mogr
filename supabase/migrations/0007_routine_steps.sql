-- routine_steps — the user's personal grooming routine. One row per step,
-- added from the skin / hair / facial-hair routines or created custom. Steps
-- are grouped morning/evening (time_of_day), reorderable (sort_order), and the
-- user pins which ones surface on the dashboard (pinned). Completion is
-- daily-resetting: a step is "done today" iff completed_on = current date —
-- no cron needed. Owner-only RLS. Idempotent.
create table if not exists public.routine_steps (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  source       text not null default 'custom',  -- skin | hair | facial_hair | custom
  label        text not null,
  time_of_day  text not null default 'am',       -- am | pm
  sort_order   int not null default 0,
  pinned       boolean not null default true,    -- show on the dashboard
  completed_on date,                             -- = today ⇒ checked today (daily reset)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists routine_steps_user_idx on public.routine_steps(user_id, sort_order);

alter table public.routine_steps enable row level security;
drop policy if exists "routine_steps_select_own" on public.routine_steps;
create policy "routine_steps_select_own" on public.routine_steps
  for select using (auth.uid() = user_id);
drop policy if exists "routine_steps_insert_own" on public.routine_steps;
create policy "routine_steps_insert_own" on public.routine_steps
  for insert with check (auth.uid() = user_id);
drop policy if exists "routine_steps_update_own" on public.routine_steps;
create policy "routine_steps_update_own" on public.routine_steps
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "routine_steps_delete_own" on public.routine_steps;
create policy "routine_steps_delete_own" on public.routine_steps
  for delete using (auth.uid() = user_id);

drop trigger if exists routine_steps_set_updated_at on public.routine_steps;
create trigger routine_steps_set_updated_at before update on public.routine_steps
  for each row execute function public.set_updated_at();
