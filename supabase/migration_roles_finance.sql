-- Run once on existing project (after schema.sql)
-- Adds finance + accountant roles, salaries, and updates fee RPCs

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('super_admin','principal','teacher','finance','accountant'));

create table if not exists public.teacher_salaries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  monthly_salary numeric(12,2) not null default 0,
  unique (teacher_id)
);

create table if not exists public.salary_payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  month int not null check (month between 1 and 12),
  year int not null,
  method text not null default 'cash',
  receipt_no text not null unique,
  paid_at timestamptz not null default now(),
  unique (teacher_id, month, year)
);

alter table public.teacher_salaries enable row level security;
alter table public.salary_payments enable row level security;

drop policy if exists salaries_select on public.teacher_salaries;
drop policy if exists salaries_write on public.teacher_salaries;
drop policy if exists salary_pay_select on public.salary_payments;
drop policy if exists salary_pay_write on public.salary_payments;

create policy salaries_select on public.teacher_salaries for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy salaries_write on public.teacher_salaries for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
);

create policy salary_pay_select on public.salary_payments for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy salary_pay_write on public.salary_payments for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
);

-- Fee writes: finance; collect: accountant (and finance)
create or replace function public.generate_invoices(p_month int, p_year int, p_due_day int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_school uuid; v_created int := 0; r record; fee numeric; due date; n int;
begin
  if (select role from public.profiles where id = auth.uid()) <> 'finance' then raise exception 'Only Finance'; end if;
  v_school := public.my_school_id();
  due := make_date(p_year, p_month, least(greatest(coalesce(p_due_day,10),1),28));
  for r in
    select s.id as student_id, c.id as class_id
    from public.students s
    join public.sections sec on sec.id = s.section_id
    join public.classes c on c.id = sec.class_id
    where s.school_id = v_school and s.status = 'active'
  loop
    select monthly_fee into fee from public.fee_structure where class_id = r.class_id;
    fee := coalesce(fee, 0);
    insert into public.fee_invoices (school_id, student_id, month, year, amount, due_date, status)
    values (v_school, r.student_id, p_month, p_year, fee, due, 'unpaid')
    on conflict (student_id, month, year) do nothing;
    get diagnostics n = row_count;
    v_created := v_created + n;
  end loop;
  return jsonb_build_object('created', v_created);
end;
$$;

create or replace function public.collect_fee(p_invoice_id uuid, p_amount numeric, p_method text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_school uuid; inv public.fee_invoices; v_receipt text; net numeric; new_paid numeric; v_status text; v_role text;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role not in ('accountant', 'finance') then raise exception 'Only Accountant or Finance'; end if;
  v_school := public.my_school_id();
  select * into inv from public.fee_invoices where id = p_invoice_id and school_id = v_school for update;
  if not found then raise exception 'Invoice not found'; end if;
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  net := inv.amount - coalesce(inv.discount,0);
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

create or replace function public.delete_payment(p_payment_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_school uuid; pay public.payments; inv public.fee_invoices; new_paid numeric; net numeric; v_status text;
begin
  if (select role from public.profiles where id = auth.uid()) <> 'finance' then raise exception 'Only Finance'; end if;
  v_school := public.my_school_id();
  select * into pay from public.payments where id = p_payment_id and school_id = v_school;
  if not found then raise exception 'Payment not found'; end if;
  select * into inv from public.fee_invoices where id = pay.invoice_id for update;
  delete from public.payments where id = p_payment_id;
  new_paid := greatest(inv.paid_amount - pay.amount, 0);
  net := inv.amount - coalesce(inv.discount,0);
  v_status := case when new_paid >= net and new_paid > 0 then 'paid' when new_paid > 0 then 'partial' else 'unpaid' end;
  update public.fee_invoices set paid_amount = new_paid, status = v_status where id = inv.id;
end;
$$;

create or replace function public.pay_salary(p_teacher_id uuid, p_amount numeric, p_month int, p_year int, p_method text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_school uuid; v_receipt text;
begin
  if (select role from public.profiles where id = auth.uid()) <> 'finance' then raise exception 'Only Finance'; end if;
  v_school := public.my_school_id();
  if p_amount <= 0 then raise exception 'Amount must be positive'; end if;
  v_receipt := 'S-' || to_char(now(), 'YYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6);
  insert into public.salary_payments (school_id, teacher_id, amount, month, year, method, receipt_no)
  values (v_school, p_teacher_id, p_amount, p_month, p_year, coalesce(nullif(trim(p_method),''),'cash'), v_receipt);
  return jsonb_build_object('receipt_no', v_receipt);
end;
$$;

-- Super Admin creates school + Principal only. Principal adds Finance/Accountant later.
create or replace function public.create_school(
  p_name text, p_slug text, p_address text, p_phone text, p_email text,
  p_principal_name text, p_principal_email text, p_principal_password text
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_school public.schools; v_user uuid; v_slug text;
begin
  if not public.is_super_admin() then raise exception 'Only Super Admin can create a school'; end if;
  if length(trim(p_name)) < 3 then raise exception 'School name is required'; end if;
  if length(p_principal_password) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  v_slug := nullif(trim(p_slug), '');
  if v_slug is null then v_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g')); end if;
  insert into public.schools (name, slug, address, phone, email)
  values (trim(p_name), v_slug, nullif(trim(p_address),''), nullif(trim(p_phone),''), nullif(trim(p_email),''))
  returning * into v_school;
  perform public.seed_school(v_school.id);
  v_user := public._create_auth_user(p_principal_email, p_principal_password,
    jsonb_build_object('name', trim(p_principal_name), 'role', 'principal', 'school_id', v_school.id::text));
  update public.profiles set school_id = v_school.id, role = 'principal', name = trim(p_principal_name) where id = v_user;
  return jsonb_build_object('id', v_school.id, 'name', v_school.name, 'slug', v_school.slug);
end;
$$;

-- Principal creates Finance or Accountant for their school
create or replace function public.create_school_staff(
  p_name text, p_email text, p_password text, p_phone text, p_role text
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_school uuid; v_user uuid;
begin
  if (select role from public.profiles where id = auth.uid()) <> 'principal' then raise exception 'Only Principal'; end if;
  if p_role not in ('finance', 'accountant') then raise exception 'Role must be finance or accountant'; end if;
  v_school := public.my_school_id();
  if v_school is null then raise exception 'No school'; end if;
  if length(p_password) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  v_user := public._create_auth_user(
    p_email, p_password,
    jsonb_build_object('name', trim(p_name), 'role', p_role, 'school_id', v_school::text, 'phone', coalesce(p_phone,''))
  );
  update public.profiles
  set school_id = v_school, role = p_role, name = trim(p_name), phone = nullif(trim(p_phone),'')
  where id = v_user;
  return v_user;
end;
$$;

create or replace function public.set_staff_active(p_staff_id uuid, p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if (select role from public.profiles where id = auth.uid()) <> 'principal' then raise exception 'Only Principal'; end if;
  update public.profiles set is_active = p_active
  where id = p_staff_id and role in ('finance', 'accountant') and school_id = public.my_school_id();
end;
$$;

create or replace function public.set_school_active(p_school_id uuid, p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'Only Super Admin'; end if;
  update public.schools set is_active = p_active where id = p_school_id;
  update public.profiles set is_active = p_active
  where school_id = p_school_id and role in ('principal','teacher','finance','accountant');
end;
$$;

-- Allow finance to write students/fees via RLS (in addition to principal where still used)
drop policy if exists students_write on public.students;
create policy students_write on public.students for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
);

drop policy if exists fee_struct_write on public.fee_structure;
create policy fee_struct_write on public.fee_structure for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
);

drop policy if exists invoices_write on public.fee_invoices;
create policy invoices_write on public.fee_invoices for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
);

drop policy if exists payments_write on public.payments;
create policy payments_write on public.payments for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance','accountant')
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) in ('finance','accountant')
);

grant execute on function public.pay_salary to authenticated;
grant execute on function public.create_school_staff to authenticated;
grant execute on function public.set_staff_active to authenticated;
grant select, insert, update, delete on public.teacher_salaries to authenticated;
grant select, insert, update, delete on public.salary_payments to authenticated;
