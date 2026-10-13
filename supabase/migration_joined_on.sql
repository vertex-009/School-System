-- Join / leave dates for salary window (hire month → suspend month).
-- Run once in Supabase SQL Editor.

alter table public.profiles
  add column if not exists joined_on date;

alter table public.profiles
  add column if not exists left_on date;

alter table public.other_employees
  add column if not exists joined_on date;

alter table public.other_employees
  add column if not exists left_on date;

-- Backfill from created_at where missing
update public.profiles
set joined_on = coalesce(joined_on, (created_at at time zone 'utc')::date, current_date)
where joined_on is null;

update public.other_employees
set joined_on = coalesce(joined_on, (created_at at time zone 'utc')::date, current_date)
where joined_on is null;

-- If suspended and left_on empty, set left_on to today (best-effort)
update public.profiles
set left_on = current_date
where is_active = false and left_on is null and role in ('teacher', 'finance');

update public.other_employees
set left_on = current_date
where is_active = false and left_on is null;

create index if not exists idx_profiles_joined_on on public.profiles (school_id, joined_on);
create index if not exists idx_other_employees_joined_on on public.other_employees (school_id, joined_on);
