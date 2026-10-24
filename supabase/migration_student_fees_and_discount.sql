-- Migration: Student Fee Structure and Individual Discounts
-- Run this migration in Supabase SQL Editor to enable per-student fee configuration at admission.

-- 1. Add Fee & Discount columns to public.students table
alter table public.students
  add column if not exists admission_fee numeric(12,2) not null default 0,
  add column if not exists monthly_fee numeric(12,2) not null default 0,
  add column if not exists transport_fee numeric(12,2) not null default 0,
  add column if not exists misc_fee numeric(12,2) not null default 0,
  add column if not exists discount numeric(12,2) not null default 0;

-- 2. Backfill existing students from class fee_structure so no existing student fees are lost
update public.students s
set monthly_fee = fs.monthly_fee
from public.sections sec
join public.fee_structure fs on fs.class_id = sec.class_id
where s.section_id = sec.id
  and coalesce(s.monthly_fee, 0) = 0
  and coalesce(fs.monthly_fee, 0) > 0;

-- 3. Update generate_invoices function to incorporate individual student monthly fee, transport, misc, and discount
create or replace function public.generate_invoices(p_month int, p_year int, p_due_day int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_school uuid;
  v_created int := 0;
  r record;
  fee numeric;
  disc numeric;
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
    select s.id as student_id,
           c.id as class_id,
           coalesce(s.monthly_fee, 0) as s_monthly,
           coalesce(s.transport_fee, 0) as s_transport,
           coalesce(s.misc_fee, 0) as s_misc,
           coalesce(s.discount, 0) as s_disc
    from public.students s
    join public.sections sec on sec.id = s.section_id
    join public.classes c on c.id = sec.class_id
    where s.school_id = v_school and s.status = 'active'
  loop
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

