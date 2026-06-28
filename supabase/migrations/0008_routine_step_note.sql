-- A short description shown under each routine step on the routine page
-- (a tidy one-liner derived from the generated routine's detail/cadence).
-- Optional; custom steps may have none. Idempotent.
alter table public.routine_steps add column if not exists note text;
