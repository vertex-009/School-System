-- Allow Principal to pay salaries (Teachers, Finance Staff, Other Employees)
-- Disallow Finance from paying Finance staff salaries.
-- Run in Supabase SQL Editor.

create or replace function public.pay_salary(
  p_teacher_id uuid,
  p_amount numeric,
  p_month int,
  p_year int,
  p_method text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_school uuid;
  v_receipt text;
  v_caller_role text;
  v_target_role text;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role not in ('finance', 'principal') then
    raise exception 'Only Finance or Principal can disburse salary';
  end if;

  select role into v_target_role from public.profiles where id = p_teacher_id;

  -- Finance cannot pay finance staff salary
  if v_caller_role = 'finance' and v_target_role = 'finance' then
    raise exception 'Finance staff cannot pay finance staff salary. Only Principal can pay Finance staff.';
  end if;

  v_school := public.my_school_id();
  if v_school is null then raise exception 'No school assigned'; end if;
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;

  v_receipt := 'S-' || to_char(now(), 'YYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6);
  insert into public.salary_payments (school_id, teacher_id, amount, month, year, method, receipt_no)
  values (v_school, p_teacher_id, p_amount, p_month, p_year, coalesce(nullif(trim(p_method),''),'cash'), v_receipt);

  return jsonb_build_object('receipt_no', v_receipt);
end;
$$;

create or replace function public.pay_other_employee_salary(
  p_employee_id uuid,
  p_amount numeric,
  p_month int,
  p_year int,
  p_method text default 'cash'
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_school uuid;
  v_receipt text;
  v_caller_role text;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role not in ('finance', 'principal') then
    raise exception 'Only Finance or Principal can pay other employee salary';
  end if;

  v_school := public.my_school_id();
  if v_school is null then raise exception 'No school assigned'; end if;
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;

  v_receipt := 'O-' || to_char(now(), 'YYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6);
  insert into public.other_salary_payments (school_id, employee_id, amount, month, year, method, receipt_no)
  values (v_school, p_employee_id, p_amount, p_month, p_year, coalesce(nullif(trim(p_method),''),'cash'), v_receipt);

  return jsonb_build_object('receipt_no', v_receipt);
end;
$$;

grant execute on function public.pay_salary to authenticated;
grant execute on function public.pay_other_employee_salary to authenticated;

