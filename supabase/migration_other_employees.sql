-- Other employees (driver, peon, guard, etc.) — salary only, no login.
-- Run once in Supabase SQL Editor.

create table if not exists public.other_employees (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  job_title text not null,
  phone text,
  cnic text,
  monthly_salary numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.other_salary_payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  employee_id uuid not null references public.other_employees(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  month int not null check (month between 1 and 12),
  year int not null,
  method text not null default 'cash',
  receipt_no text not null unique,
  paid_at timestamptz not null default now(),
  unique (employee_id, month, year)
);

create index if not exists idx_other_employees_school
  on public.other_employees (school_id, is_active);

create index if not exists idx_other_salary_payments_school
  on public.other_salary_payments (school_id, year, month);

alter table public.other_employees enable row level security;
alter table public.other_salary_payments enable row level security;

drop policy if exists other_employees_select on public.other_employees;
drop policy if exists other_employees_write on public.other_employees;
drop policy if exists other_salary_pay_select on public.other_salary_payments;
drop policy if exists other_salary_pay_write on public.other_salary_payments;

-- Principal + Finance can view; Finance writes
create policy other_employees_select on public.other_employees for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);

create policy other_employees_write on public.other_employees for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
);

create policy other_salary_pay_select on public.other_salary_payments for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);

create policy other_salary_pay_write on public.other_salary_payments for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
);

create or replace function public.pay_other_employee_salary(
  p_employee_id uuid,
  p_amount numeric,
  p_month int,
  p_year int,
  p_method text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_school uuid;
  v_receipt text;
  v_emp public.other_employees;
begin
  if (select role from public.profiles where id = auth.uid()) <> 'finance' then
    raise exception 'Only Finance';
  end if;
  v_school := public.my_school_id();
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;

  select * into v_emp
  from public.other_employees
  where id = p_employee_id and school_id = v_school and is_active = true;

  if not found then raise exception 'Employee not found or inactive'; end if;

  v_receipt := 'O-' || to_char(now(), 'YYMMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.other_salary_payments (school_id, employee_id, amount, month, year, method, receipt_no)
  values (v_school, p_employee_id, p_amount, p_month, p_year, coalesce(nullif(trim(p_method), ''), 'cash'), v_receipt);

  return jsonb_build_object('receipt_no', v_receipt);
end;
$$;

grant select, insert, update, delete on public.other_employees to authenticated;
grant select, insert, update, delete on public.other_salary_payments to authenticated;
grant execute on function public.pay_other_employee_salary to authenticated;
