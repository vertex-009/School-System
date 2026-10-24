-- ==============================================================================
-- Comprehensive A to Z Security & Roles Synchronization Migration
-- Enables both Principal and Finance to perform all administrative and financial actions
-- without hitting Supabase Row Level Security (RLS) or RPC role mismatch violations.
-- Run once in Supabase SQL Editor.
-- ==============================================================================

-- 1. Table: public.teacher_salaries
alter table public.teacher_salaries enable row level security;
drop policy if exists salaries_select on public.teacher_salaries;
drop policy if exists salaries_write on public.teacher_salaries;

create policy salaries_select on public.teacher_salaries for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy salaries_write on public.teacher_salaries for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
);

-- 2. Table: public.other_employees
alter table public.other_employees enable row level security;
drop policy if exists other_employees_select on public.other_employees;
drop policy if exists other_employees_write on public.other_employees;

create policy other_employees_select on public.other_employees for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy other_employees_write on public.other_employees for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
);

-- 3. Table: public.student_transfers
alter table public.student_transfers enable row level security;
drop policy if exists transfers_select on public.student_transfers;
drop policy if exists transfers_write on public.student_transfers;

create policy transfers_select on public.student_transfers for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy transfers_write on public.student_transfers for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
);

-- 4. Table: public.school_expenses
alter table public.school_expenses enable row level security;
drop policy if exists expenses_select on public.school_expenses;
drop policy if exists expenses_write on public.school_expenses;

create policy expenses_select on public.school_expenses for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy expenses_write on public.school_expenses for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
);

-- 5. Table: public.fee_structure
alter table public.fee_structure enable row level security;
drop policy if exists fee_struct_select on public.fee_structure;
drop policy if exists fee_struct_write on public.fee_structure;

create policy fee_struct_select on public.fee_structure for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy fee_struct_write on public.fee_structure for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
);

-- 6. Table: public.fee_invoices
alter table public.fee_invoices enable row level security;
drop policy if exists invoices_select on public.fee_invoices;
drop policy if exists invoices_write on public.fee_invoices;

create policy invoices_select on public.fee_invoices for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy invoices_write on public.fee_invoices for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
);

-- 7. Table: public.payments
alter table public.payments enable row level security;
drop policy if exists payments_select on public.payments;
drop policy if exists payments_write on public.payments;

create policy payments_select on public.payments for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy payments_write on public.payments for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'accountant', 'principal')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'accountant', 'principal')
);

-- 8. Table: public.salary_payments
alter table public.salary_payments enable row level security;
drop policy if exists salary_pay_select on public.salary_payments;
drop policy if exists salary_pay_write on public.salary_payments;

create policy salary_pay_select on public.salary_payments for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy salary_pay_write on public.salary_payments for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
);

-- 9. Table: public.other_salary_payments
alter table public.other_salary_payments enable row level security;
drop policy if exists other_salary_pay_select on public.other_salary_payments;
drop policy if exists other_salary_pay_write on public.other_salary_payments;

create policy other_salary_pay_select on public.other_salary_payments for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy other_salary_pay_write on public.other_salary_payments for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
);

-- 10. Table: public.students
alter table public.students enable row level security;
drop policy if exists students_select on public.students;
drop policy if exists students_write on public.students;

create policy students_select on public.students for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy students_write on public.students for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance', 'principal')
);

-- 11. RPC: set_staff_salary
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

-- 12. RPC: collect_fee (Permit Accountant, Finance, and Principal)
create or replace function public.collect_fee(p_invoice_id uuid, p_amount numeric, p_method text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_school uuid;
  inv public.fee_invoices;
  v_receipt text;
  net numeric;
  new_paid numeric;
  v_status text;
  v_role text;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role not in ('accountant', 'finance', 'principal') then
    raise exception 'Only Accountant, Finance or Principal can collect fees';
  end if;

  v_school := public.my_school_id();
  select * into inv from public.fee_invoices where id = p_invoice_id and school_id = v_school for update;
  if not found then raise exception 'Invoice not found'; end if;
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;

  net := inv.amount - coalesce(inv.discount, 0);
  new_paid := inv.paid_amount + p_amount;
  if new_paid > net + 0.01 then raise exception 'Amount exceeds balance'; end if;

  v_status := case when new_paid >= net then 'paid' when new_paid > 0 then 'partial' else 'unpaid' end;
  v_receipt := 'R-' || to_char(now(), 'YYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6);

  insert into public.payments (school_id, invoice_id, amount, method, receipt_no)
  values (v_school, p_invoice_id, p_amount, coalesce(nullif(trim(p_method),''),'cash'), v_receipt);

  update public.fee_invoices set paid_amount = new_paid, status = v_status where id = p_invoice_id;

  return jsonb_build_object('receipt_no', v_receipt);
end;
$$;

-- 13. RPC: delete_payment (Permit Finance and Principal)
create or replace function public.delete_payment(p_payment_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_school uuid;
  pay public.payments;
  inv public.fee_invoices;
  new_paid numeric;
  net numeric;
  v_status text;
  v_role text;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role not in ('finance', 'principal') then
    raise exception 'Only Finance or Principal can delete payments';
  end if;

  v_school := public.my_school_id();
  select * into pay from public.payments where id = p_payment_id and school_id = v_school;
  if not found then raise exception 'Payment not found'; end if;

  select * into inv from public.fee_invoices where id = pay.invoice_id for update;
  delete from public.payments where id = p_payment_id;

  new_paid := greatest(inv.paid_amount - pay.amount, 0);
  net := inv.amount - coalesce(inv.discount, 0);
  v_status := case when new_paid >= net and new_paid > 0 then 'paid' when new_paid > 0 then 'partial' else 'unpaid' end;

  update public.fee_invoices set paid_amount = new_paid, status = v_status where id = inv.id;
end;
$$;

-- 14. RPC: pay_salary (Principal & Finance)
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

-- 15. RPC: pay_other_employee_salary (Principal & Finance)
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

-- 16. RPC: generate_invoices (Auto-generate invoices respecting join dates & fees)
create or replace function public.generate_invoices(
  p_month int,
  p_year int,
  p_due_day int default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school uuid;
  due date;
  v_created int := 0;
  r record;
  fee numeric;
  disc numeric;
  n int;
begin
  v_school := public.my_school_id();
  if v_school is null then
    return jsonb_build_object('error', 'no school');
  end if;

  due := make_date(p_year, p_month, least(p_due_day, 28));

  for r in
    select s.id as student_id, coalesce(s.monthly_fee, 0) as s_monthly, coalesce(s.transport_fee, 0) as s_transport,
           coalesce(s.misc_fee, 0) as s_misc, coalesce(s.discount, 0) as s_disc, sec.class_id,
           coalesce(s.joined_on, (s.created_at at time zone 'utc')::date) as join_date
    from public.students s
    join public.sections sec on sec.id = s.section_id
    join public.classes c on c.id = sec.class_id
    where s.school_id = v_school and s.status = 'active'
  loop
    -- Strict check: skip if student joined in a month after this invoice period
    if r.join_date is not null and (extract(year from r.join_date) * 12 + extract(month from r.join_date)) > (p_year * 12 + p_month) then
      continue;
    end if;

    -- Check if student has individual fee configured (monthly, transport, or misc)
    if r.s_monthly > 0 or r.s_transport > 0 or r.s_misc > 0 then
      fee := r.s_monthly + r.s_transport + r.s_misc;
    else
      -- Fallback to class fee_structure for older records
      select monthly_fee into fee from public.fee_structure where class_id = r.class_id;
      fee := coalesce(fee, 0);
    end if;

    if fee <= 0 then
      continue;
    end if;

    disc := least(coalesce(r.s_disc, 0), fee);

    insert into public.fee_invoices (school_id, student_id, month, year, amount, discount, due_date, status)
    values (v_school, r.student_id, p_month, p_year, fee, disc, due, 'unpaid')
    on conflict (student_id, month, year) do update
      set amount = excluded.amount,
          discount = excluded.discount,
          due_date = excluded.due_date
      where public.fee_invoices.status = 'unpaid'
        and coalesce(public.fee_invoices.paid_amount, 0) = 0;

    get diagnostics n = row_count;
    v_created := v_created + n;
  end loop;

  return jsonb_build_object('created', v_created);
end;
$$;

-- 17. Grants
grant execute on function public.set_staff_salary to authenticated;
grant execute on function public.collect_fee to authenticated;
grant execute on function public.delete_payment to authenticated;
grant execute on function public.pay_salary to authenticated;
grant execute on function public.pay_other_employee_salary to authenticated;
grant execute on function public.generate_invoices to authenticated;
