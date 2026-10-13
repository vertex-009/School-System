-- Dashboard performance: composite indexes + summary RPCs (SECURITY INVOKER).
-- School always from my_school_id() — never pass school_id from the client.

-- ---------- indexes ----------
create index if not exists idx_students_school_status
  on public.students (school_id, status);

create index if not exists idx_profiles_school_role_active
  on public.profiles (school_id, role, is_active);

create index if not exists idx_payments_school_paid_at
  on public.payments (school_id, paid_at);

create index if not exists idx_fee_invoices_school_month_year
  on public.fee_invoices (school_id, month, year);

create index if not exists idx_fee_invoices_school_status_due
  on public.fee_invoices (school_id, status, due_date);

create index if not exists idx_marks_school
  on public.marks (school_id);

create index if not exists idx_exams_school
  on public.exams (school_id);

create index if not exists idx_announcements_school
  on public.announcements (school_id);

create index if not exists idx_classes_school
  on public.classes (school_id);

create index if not exists idx_teacher_assignments_teacher
  on public.teacher_assignments (teacher_id);

-- ---------- principal ----------
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
  v_month_start timestamptz := date_trunc('month', now());
  v_month_end timestamptz := date_trunc('month', now()) + interval '1 month';
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
    'unpaid', (select count(*)::int from public.fee_invoices where school_id = v_school and status in ('unpaid', 'partial')),
    'left_students', (select count(*)::int from public.students where school_id = v_school and status = 'left'),
    'classes', (select count(*)::int from public.classes where school_id = v_school),
    'collected', coalesce((
      select sum(amount)::numeric from public.payments
      where school_id = v_school and paid_at >= v_month_start and paid_at < v_month_end
    ), 0),
    'billed', coalesce((
      select sum(amount - coalesce(discount, 0))::numeric from public.fee_invoices
      where school_id = v_school and month = v_month and year = v_year
    ), 0),
    'paid_on_invoices', coalesce((
      select sum(coalesce(paid_amount, 0))::numeric from public.fee_invoices
      where school_id = v_school and month = v_month and year = v_year
    ), 0)
  );
end;
$$;

-- ---------- finance ----------
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
  v_month_start timestamptz := date_trunc('month', now());
  v_month_end timestamptz := date_trunc('month', now()) + interval '1 month';
  v_today date := current_date;
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
    'overdue', (select count(*)::int from public.fee_invoices
      where school_id = v_school and status in ('unpaid', 'partial') and due_date < v_today),
    'students', (select count(*)::int from public.students where school_id = v_school and status = 'active'),
    'collected', coalesce((
      select sum(amount)::numeric from public.payments
      where school_id = v_school and paid_at >= v_month_start and paid_at < v_month_end
    ), 0)
  );
end;
$$;

-- ---------- teacher ----------
create or replace function public.get_teacher_dashboard()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_school uuid;
  v_role text;
begin
  select role, school_id into v_role, v_school from public.profiles where id = auth.uid();
  if v_role is distinct from 'teacher' then
    raise exception 'Only Teacher';
  end if;
  if v_school is null then
    raise exception 'No school';
  end if;

  return jsonb_build_object(
    'assignment_count', (select count(*)::int from public.teacher_assignments where teacher_id = auth.uid()),
    'announcement_count', (select count(*)::int from public.announcements where school_id = v_school),
    'period_count', (select count(*)::int from public.timetable_slots
      where school_id = v_school and teacher_id = auth.uid())
  );
end;
$$;

grant execute on function public.get_principal_dashboard() to authenticated;
grant execute on function public.get_finance_dashboard() to authenticated;
grant execute on function public.get_teacher_dashboard() to authenticated;
