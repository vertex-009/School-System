-- Principal UI: edit finance profiles + announcement audiences.
-- Run once in Supabase SQL Editor.

-- Principal may update teacher AND finance profiles (name/phone/cnic/photo).
drop policy if exists profiles_principal_teachers on public.profiles;
drop policy if exists profiles_principal_staff on public.profiles;
create policy profiles_principal_staff on public.profiles for update using (
  (select role from public.profiles where id = auth.uid()) = 'principal'
  and school_id = public.my_school_id()
  and role in ('teacher', 'finance')
) with check (
  (select role from public.profiles where id = auth.uid()) = 'principal'
  and school_id = public.my_school_id()
  and role in ('teacher', 'finance')
);

-- Announcement targeting: all | finance | teachers | teacher (one person)
alter table public.announcements
  add column if not exists audience text not null default 'all';

alter table public.announcements
  drop constraint if exists announcements_audience_check;

alter table public.announcements
  add constraint announcements_audience_check
  check (audience in ('all', 'finance', 'teachers', 'teacher'));

alter table public.announcements
  add column if not exists target_teacher_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_announcements_audience
  on public.announcements (school_id, audience);
