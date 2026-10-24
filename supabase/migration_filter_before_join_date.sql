-- =============================================================================
-- Migration: Ensure fees & salaries strictly respect joining dates
-- Prevents teachers and students from having unpaid dues for months prior to
-- their joining / admission date.
-- Run once in Supabase SQL Editor.
-- =============================================================================

-- 1. Ensure students table has joined_on column and backfill from created_at
alter table public.students
  add column if not exists joined_on date;

update public.students
set joined_on = coalesce(joined_on, (created_at at time zone 'utc')::date, current_date)
where joined_on is null;

create index if not exists idx_students_joined_on on public.students (school_id, joined_on);

-- 2. Update generate_invoices stored procedure to never generate invoices for
--    months prior to the student's admission / joining date.
create or replace function public.generate_invoices(
  p_month int,
  p_year int,
  p_due_day int default 10
)
returns jsonb
language plpgsql
security definer
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

grant execute on function public.generate_invoices to authenticated;

-- 3. Cleanup any unpaid, uncollected invoices that were mistakenly created
--    for months before the student's admission / joining date.
delete from public.fee_invoices fi
using public.students s
where fi.student_id = s.id
  and fi.status = 'unpaid'
  and coalesce(fi.paid_amount, 0) = 0
  and (fi.year * 12 + fi.month) < (
    extract(year from coalesce(s.joined_on, (s.created_at at time zone 'utc')::date)) * 12 +
    extract(month from coalesce(s.joined_on, (s.created_at at time zone 'utc')::date))
  );

