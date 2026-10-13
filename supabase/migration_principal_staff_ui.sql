-- Principal staff UI: assignment timestamps + principal may add other employees (salary still Finance).
-- Run once in Supabase SQL Editor.

alter table public.teacher_assignments
  add column if not exists created_at timestamptz not null default now();

create index if not exists idx_teacher_assignments_created
  on public.teacher_assignments (school_id, created_at);

-- Principal can create/update other employees; pay remains Finance-only via other_salary_payments policies.
drop policy if exists other_employees_write on public.other_employees;
create policy other_employees_write on public.other_employees for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
);
