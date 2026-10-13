-- Allow teachers & finance to post announcements; expand audiences.
-- Run once in Supabase SQL Editor.

alter table public.announcements
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

alter table public.announcements
  drop constraint if exists announcements_audience_check;

alter table public.announcements
  add constraint announcements_audience_check
  check (audience in ('all', 'finance', 'teachers', 'teacher', 'principal'));

drop policy if exists announcements_write on public.announcements;
create policy announcements_write on public.announcements for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('principal', 'teacher', 'finance')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('principal', 'teacher', 'finance')
);
