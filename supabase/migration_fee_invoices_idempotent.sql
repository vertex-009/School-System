-- Idempotent monthly fee invoices.
-- Run in Supabase SQL Editor AFTER read-only duplicate-check returns 0 rows.
-- Does NOT touch collect_fee. Does NOT delete data.

-- Unique(student_id, month, year) only if no constraint with that definition exists.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.fee_invoices'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) ilike '%student_id%'
      and pg_get_constraintdef(oid) ilike '%month%'
      and pg_get_constraintdef(oid) ilike '%year%'
  ) then
    alter table public.fee_invoices
      add constraint fee_invoices_student_id_month_year_key
      unique (student_id, month, year);
  end if;
end $$;

-- Finance-only; active students only; skip fee <= 0; never overwrite existing rows.
create or replace function public.generate_invoices(p_month int, p_year int, p_due_day int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school uuid;
  v_created int := 0;
  r record;
  fee numeric;
  due date;
  n int;
begin
  if (select role from public.profiles where id = auth.uid()) <> 'finance' then
    raise exception 'Only Finance';
  end if;
  v_school := public.my_school_id();
  if v_school is null then raise exception 'No school'; end if;
  if p_month < 1 or p_month > 12 then raise exception 'Invalid month'; end if;

  due := make_date(p_year, p_month, least(greatest(coalesce(p_due_day, 10), 1), 28));

  for r in
    select s.id as student_id, c.id as class_id
    from public.students s
    join public.sections sec on sec.id = s.section_id
    join public.classes c on c.id = sec.class_id
    where s.school_id = v_school
      and s.status = 'active'
  loop
    select monthly_fee into fee from public.fee_structure where class_id = r.class_id;
    fee := coalesce(fee, 0);
    if fee <= 0 then
      continue;
    end if;

    insert into public.fee_invoices (school_id, student_id, month, year, amount, due_date, status)
    values (v_school, r.student_id, p_month, p_year, fee, due, 'unpaid')
    on conflict (student_id, month, year) do nothing;

    get diagnostics n = row_count;
    v_created := v_created + n;
  end loop;

  return jsonb_build_object('created', v_created);
end;
$$;

grant execute on function public.generate_invoices to authenticated;
