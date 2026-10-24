-- Allow both Principal and Finance to insert, update and manage students via RLS.
-- Run in Supabase SQL Editor.

drop policy if exists students_write on public.students;

create policy students_write on public.students for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
);

