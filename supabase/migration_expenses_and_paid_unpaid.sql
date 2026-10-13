-- School expenses (persisted) + dashboard Paid / Unpaid (no overdue).
-- Run once in Supabase SQL editor.

create table if not exists public.school_expenses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  kind text not null check (kind in ('school', 'other')),
  title text not null,
  category text,
  purpose text,
  amount numeric(12,2) not null check (amount > 0),
  expense_date date not null default current_date,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_school_expenses_school_date
  on public.school_expenses (school_id, expense_date desc);

alter table public.school_expenses enable row level security;

drop policy if exists expenses_select on public.school_expenses;
drop policy if exists expenses_write on public.school_expenses;

create policy expenses_select on public.school_expenses for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);

create policy expenses_write on public.school_expenses for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
);

grant select, insert, delete on public.school_expenses to authenticated;

-- ---------- finance dashboard: Paid + Unpaid + Expenses (no overdue) ----------
create or replace function public.get_finance_dashboard()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_school uuid;
  v_role text;
  v_month int := extract(month from now())::int;
  v_year int := extract(year from now())::int;
  v_month_start date := date_trunc('month', now())::date;
  v_month_end date := (date_trunc('month', now()) + interval '1 month')::date;
  v_month_start_ts timestamptz := date_trunc('month', now());
  v_month_end_ts timestamptz := date_trunc('month', now()) + interval '1 month';
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role is distinct from 'finance' then
    raise exception 'Only Finance';
  end if;

  v_school := public.my_school_id();
  if v_school is null then
    raise exception 'No school';
  end if;

  return jsonb_build_object(
    'month', v_month,
    'year', v_year,
    'paid', (select count(*)::int from public.fee_invoices
      where school_id = v_school and month = v_month and year = v_year and status = 'paid'),
    'unpaid', (select count(*)::int from public.fee_invoices
      where school_id = v_school and month = v_month and year = v_year and status in ('unpaid', 'partial')),
    'students', (select count(*)::int from public.students where school_id = v_school and status = 'active'),
    'collected', coalesce((
      select sum(amount)::numeric from public.payments
      where school_id = v_school and paid_at >= v_month_start_ts and paid_at < v_month_end_ts
    ), 0),
    'expenses', coalesce((
      select sum(amount)::numeric from public.school_expenses
      where school_id = v_school and expense_date >= v_month_start and expense_date < v_month_end
    ), 0)
  );
end;
$$;

-- ---------- principal dashboard: Paid + Unpaid + Expenses ----------
create or replace function public.get_principal_dashboard()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_school uuid;
  v_role text;
  v_month int := extract(month from now())::int;
  v_year int := extract(year from now())::int;
  v_month_start date := date_trunc('month', now())::date;
  v_month_end date := (date_trunc('month', now()) + interval '1 month')::date;
  v_month_start_ts timestamptz := date_trunc('month', now());
  v_month_end_ts timestamptz := date_trunc('month', now()) + interval '1 month';
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role is distinct from 'principal' then
    raise exception 'Only Principal';
  end if;

  v_school := public.my_school_id();
  if v_school is null then
    raise exception 'No school';
  end if;

  return jsonb_build_object(
    'month', v_month,
    'year', v_year,
    'students', (select count(*)::int from public.students where school_id = v_school and status = 'active'),
    'teachers', (select count(*)::int from public.profiles where school_id = v_school and role = 'teacher' and is_active = true),
    'exams', (select count(*)::int from public.exams where school_id = v_school),
    'marks', (select count(*)::int from public.marks where school_id = v_school),
    'announcements', (select count(*)::int from public.announcements where school_id = v_school),
    'paid', (select count(*)::int from public.fee_invoices
      where school_id = v_school and month = v_month and year = v_year and status = 'paid'),
    'unpaid', (select count(*)::int from public.fee_invoices
      where school_id = v_school and month = v_month and year = v_year and status in ('unpaid', 'partial')),
    'left_students', (select count(*)::int from public.students where school_id = v_school and status = 'left'),
    'classes', (select count(*)::int from public.classes where school_id = v_school),
    'collected', coalesce((
      select sum(amount)::numeric from public.payments
      where school_id = v_school and paid_at >= v_month_start_ts and paid_at < v_month_end_ts
    ), 0),
    'billed', coalesce((
      select sum(amount - coalesce(discount, 0))::numeric from public.fee_invoices
      where school_id = v_school and month = v_month and year = v_year
    ), 0),
    'paid_on_invoices', coalesce((
      select sum(coalesce(paid_amount, 0))::numeric from public.fee_invoices
      where school_id = v_school and month = v_month and year = v_year
    ), 0),
    'expenses', coalesce((
      select sum(amount)::numeric from public.school_expenses
      where school_id = v_school and expense_date >= v_month_start and expense_date < v_month_end
    ), 0)
  );
end;
$$;

grant execute on function public.get_finance_dashboard() to authenticated;
grant execute on function public.get_principal_dashboard() to authenticated;
