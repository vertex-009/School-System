-- Fee collection announcements: optional month/year + kind.
-- Run in Supabase SQL editor after migration_staff_announcements.sql.

alter table public.announcements
  add column if not exists kind text not null default 'general';

alter table public.announcements
  drop constraint if exists announcements_kind_check;

alter table public.announcements
  add constraint announcements_kind_check
  check (kind in ('general', 'fee_open'));

alter table public.announcements
  add column if not exists fee_month int;

alter table public.announcements
  add column if not exists fee_year int;

comment on column public.announcements.kind is 'general | fee_open (finance opens a fee month)';
comment on column public.announcements.fee_month is '1-12 when kind = fee_open';
comment on column public.announcements.fee_year is 'calendar year when kind = fee_open';
