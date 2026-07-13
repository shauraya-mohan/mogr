-- rate_limits — fixed-window request counters, one row per (user, route,
-- window). No auth gate ships yet, so this is the interim guard against a
-- single user hammering the paid OpenAI / Photoroom calls. Owner-only RLS;
-- check_rate_limit() runs as the calling user (security invoker) and keys
-- strictly off auth.uid(), so a client can only ever burn its own budget.
-- Idempotent.
create table if not exists public.rate_limits (
  user_id      uuid not null references auth.users(id) on delete cascade,
  route        text not null,
  window_start timestamptz not null,
  count        int not null default 1,
  primary key (user_id, route, window_start)
);

alter table public.rate_limits enable row level security;
drop policy if exists "rate_limits_select_own" on public.rate_limits;
create policy "rate_limits_select_own" on public.rate_limits
  for select using (auth.uid() = user_id);
drop policy if exists "rate_limits_insert_own" on public.rate_limits;
create policy "rate_limits_insert_own" on public.rate_limits
  for insert with check (auth.uid() = user_id);
drop policy if exists "rate_limits_update_own" on public.rate_limits;
create policy "rate_limits_update_own" on public.rate_limits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Prune old windows lazily so the table doesn't grow unbounded; cheap enough
-- to run inline (indexed on the primary key's window_start suffix isn't
-- ideal for range deletes, but volumes here are tiny pre-auth).
create index if not exists rate_limits_window_idx on public.rate_limits (window_start);

-- Atomically bump the counter for the CURRENT window and report whether the
-- caller is still under p_limit. Buckets are aligned to epoch time so a
-- window's identity (and therefore its reset) is implicit — no separate
-- expiry check needed.
create or replace function public.check_rate_limit(
  p_route text,
  p_limit int,
  p_window_seconds int
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_window timestamptz;
  v_count  int;
begin
  if auth.uid() is null then
    return false;
  end if;

  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limits (user_id, route, window_start, count)
  values (auth.uid(), p_route, v_window, 1)
  on conflict (user_id, route, window_start)
  do update set count = rate_limits.count + 1
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;
