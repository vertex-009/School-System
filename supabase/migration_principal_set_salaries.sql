-- Migration: Allow Principal to set and update salaries for Teachers, Finance Staff, and Other Employees
-- Fixes: "new row violates row-level security policy for table 'teacher_salaries'"
-- Run this once in the Supabase SQL Editor.

-- 1. Update RLS policy on teacher_salaries for write operations
drop policy if exists salaries_write on public.teacher_salaries;
create policy salaries_write on public.teacher_salaries for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
);

-- 2. Update RLS policy on other_employees for write operations
drop policy if exists other_employees_write on public.other_employees;
create policy other_employees_write on public.other_employees for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
);

-- 3. Security Definer RPC function to set monthly staff salary safely
create or replace function public.set_staff_salary(
  p_staff_id uuid,
  p_category text,
  p_monthly_salary numeric
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_school uuid;
  v_caller_role text;
  v_target_role text;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role not in ('finance', 'principal') then
    raise exception 'Only Finance or Principal can set staff salary';
  end if;

  v_school := public.my_school_id();
  if v_school is null then raise exception 'No school assigned'; end if;
  if p_monthly_salary < 0 then raise exception 'Salary cannot be negative'; end if;

  if p_category = 'employees' then
    update public.other_employees
    set monthly_salary = p_monthly_salary
    where id = p_staff_id and school_id = v_school;
    return jsonb_build_object('ok', true);
  else
    select role into v_target_role from public.profiles where id = p_staff_id;

    -- Strict Rule: Finance staff cannot set finance staff salary
    if v_caller_role = 'finance' and v_target_role = 'finance' then
      raise exception 'Finance staff cannot set finance staff salary. Only Principal can set Finance salaries.';
    end if;

    insert into public.teacher_salaries (school_id, teacher_id, monthly_salary)
    values (v_school, p_staff_id, p_monthly_salary)
    on conflict (teacher_id)
    do update set monthly_salary = excluded.monthly_salary;

    return jsonb_build_object('ok', true);
  end if;
end;
$$;

grant execute on function public.set_staff_salary to authenticated;

