-- School SMS Lite — run once in Supabase SQL Editor
create extension if not exists pgcrypto;

-- ---------- tables ----------
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  address text,
  phone text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('super_admin','principal','teacher','finance','accountant')),
  school_id uuid references public.schools(id) on delete set null,
  phone text,
  photo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  unique (school_id, name)
);

create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  unique (class_id, name)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  unique (school_id, name)
);

create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  unique (teacher_id, section_id, subject_id)
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  section_id uuid references public.sections(id) on delete set null,
  name text not null,
  father_name text,
  guardian_phone text,
  gender text,
  dob date,
  address text,
  admission_no text not null,
  roll_no int,
  status text not null default 'active' check (status in ('active','left')),
  created_at timestamptz not null default now(),
  unique (school_id, admission_no)
);

create table if not exists public.fee_structure (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  monthly_fee numeric(12,2) not null default 0,
  unique (class_id)
);

create table if not exists public.fee_invoices (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  month int not null check (month between 1 and 12),
  year int not null,
  amount numeric(12,2) not null,
  discount numeric(12,2) not null default 0,
  discount_reason text,
  paid_amount numeric(12,2) not null default 0,
  status text not null default 'unpaid' check (status in ('unpaid','partial','paid')),
  due_date date,
  created_at timestamptz not null default now(),
  unique (student_id, month, year)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  invoice_id uuid not null references public.fee_invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method text not null default 'cash',
  receipt_no text not null unique,
  paid_at timestamptz not null default now()
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('test','final')),
  exam_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.marks (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  obtained numeric(8,2) not null default 0,
  total numeric(8,2) not null default 100,
  unique (exam_id, student_id, subject_id)
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present','absent','leave','late')),
  unique (student_id, date)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_school on public.profiles(school_id);
create index if not exists idx_students_school on public.students(school_id);
create index if not exists idx_attendance_date on public.attendance(school_id, date);
create index if not exists idx_invoices_status on public.fee_invoices(school_id, status);

-- ---------- helpers ----------
create or replace function public.current_profile()
returns public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin' and is_active);
$$;

create or replace function public.my_school_id()
returns uuid language sql stable security definer set search_path = public as $$
  select school_id from public.profiles where id = auth.uid();
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role, school_id, phone, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'teacher'),
    nullif(new.raw_user_meta_data->>'school_id', '')::uuid,
    nullif(new.raw_user_meta_data->>'phone', ''),
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- create auth user (email/password) for principal/teacher
create or replace function public._create_auth_user(p_email text, p_password text, p_meta jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  if exists (select 1 from auth.users where email = lower(p_email)) then
    raise exception 'Email already registered';
  end if;
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    lower(p_email), crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, coalesce(p_meta, '{}'::jsonb),
    now(), now(), '', '', '', ''
  );
  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    v_id, v_id,
    jsonb_build_object('sub', v_id::text, 'email', lower(p_email)),
    'email', v_id::text, now(), now(), now()
  );
  return v_id;
end;
$$;

create or replace function public.seed_school(p_school_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  class_names text[] := array['Nursery','Prep','1','2','3','4','5','6','7','8','9','10'];
  subject_names text[] := array['English','Urdu','Maths','Science','Islamiat','Pakistan Studies','Computer','General Knowledge'];
  cname text; cid uuid; i int := 0; sname text;
begin
  foreach cname in array class_names loop
    i := i + 1;
    insert into public.classes (school_id, name, sort_order) values (p_school_id, cname, i) returning id into cid;
    insert into public.sections (school_id, class_id, name) values (p_school_id, cid, 'A'), (p_school_id, cid, 'B');
    insert into public.fee_structure (school_id, class_id, monthly_fee) values (p_school_id, cid, 0);
  end loop;
  foreach sname in array subject_names loop
    insert into public.subjects (school_id, name) values (p_school_id, sname);
  end loop;
end;
$$;

create or replace function public.create_school(
  p_name text, p_slug text, p_address text, p_phone text, p_email text,
  p_principal_name text, p_principal_email text, p_principal_password text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school public.schools;
  v_user uuid;
  v_slug text;
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
  v_user := public._create_auth_user(
    p_principal_email, p_principal_password,
    jsonb_build_object('name', trim(p_principal_name), 'role', 'principal', 'school_id', v_school.id::text)
  );
  update public.profiles set school_id = v_school.id, role = 'principal', name = trim(p_principal_name) where id = v_user;
  return jsonb_build_object('id', v_school.id, 'name', v_school.name, 'slug', v_school.slug);
end;
$$;

create or replace function public.set_school_active(p_school_id uuid, p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'Only Super Admin'; end if;
  update public.schools set is_active = p_active where id = p_school_id;
  update public.profiles set is_active = p_active where school_id = p_school_id and role in ('principal','teacher','finance','accountant');
end;
$$;

create or replace function public.create_teacher(p_name text, p_email text, p_password text, p_phone text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_school uuid; v_user uuid;
begin
  if (select role from public.profiles where id = auth.uid()) <> 'principal' then raise exception 'Only Principal'; end if;
  v_school := public.my_school_id();
  if v_school is null then raise exception 'No school'; end if;
  if length(p_password) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  v_user := public._create_auth_user(p_email, p_password, jsonb_build_object('name', trim(p_name), 'role', 'teacher', 'school_id', v_school::text, 'phone', coalesce(p_phone,'')));
  update public.profiles set school_id = v_school, role = 'teacher', name = trim(p_name), phone = nullif(trim(p_phone),'') where id = v_user;
  return v_user;
end;
$$;

create or replace function public.set_teacher_active(p_teacher_id uuid, p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if (select role from public.profiles where id = auth.uid()) <> 'principal' then raise exception 'Only Principal'; end if;
  update public.profiles set is_active = p_active
  where id = p_teacher_id and role = 'teacher' and school_id = public.my_school_id();
end;
$$;

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

create or replace function public.generate_invoices(p_month int, p_year int, p_due_day int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_school uuid; v_created int := 0; r record; fee numeric; due date; n int;
begin
  if (select role from public.profiles where id = auth.uid()) <> 'principal' then raise exception 'Only Principal'; end if;
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
  v_school uuid; inv public.fee_invoices; v_receipt text; net numeric; new_paid numeric; v_status text;
begin
  if (select role from public.profiles where id = auth.uid()) <> 'principal' then raise exception 'Only Principal'; end if;
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
  if (select role from public.profiles where id = auth.uid()) <> 'principal' then raise exception 'Only Principal'; end if;
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

-- ---------- RLS ----------
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.sections enable row level security;
alter table public.subjects enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.students enable row level security;
alter table public.fee_structure enable row level security;
alter table public.fee_invoices enable row level security;
alter table public.payments enable row level security;
alter table public.exams enable row level security;
alter table public.marks enable row level security;
alter table public.attendance enable row level security;
alter table public.announcements enable row level security;

-- Safe to re-run: drop old policies first
drop policy if exists schools_sa_all on public.schools;
drop policy if exists schools_member_select on public.schools;
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists profiles_principal_teachers on public.profiles;
drop policy if exists classes_select on public.classes;
drop policy if exists classes_write on public.classes;
drop policy if exists sections_select on public.sections;
drop policy if exists sections_write on public.sections;
drop policy if exists subjects_select on public.subjects;
drop policy if exists subjects_write on public.subjects;
drop policy if exists assign_select on public.teacher_assignments;
drop policy if exists assign_write on public.teacher_assignments;
drop policy if exists students_select on public.students;
drop policy if exists students_write on public.students;
drop policy if exists fee_struct_select on public.fee_structure;
drop policy if exists fee_struct_write on public.fee_structure;
drop policy if exists invoices_select on public.fee_invoices;
drop policy if exists invoices_write on public.fee_invoices;
drop policy if exists payments_select on public.payments;
drop policy if exists payments_write on public.payments;
drop policy if exists exams_select on public.exams;
drop policy if exists exams_write on public.exams;
drop policy if exists marks_select on public.marks;
drop policy if exists marks_teacher on public.marks;
drop policy if exists attendance_select on public.attendance;
drop policy if exists attendance_write on public.attendance;
drop policy if exists announcements_select on public.announcements;
drop policy if exists announcements_write on public.announcements;

-- schools
create policy schools_sa_all on public.schools for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy schools_member_select on public.schools for select using (id = public.my_school_id());

-- profiles
create policy profiles_select on public.profiles for select using (
  public.is_super_admin() or id = auth.uid() or school_id = public.my_school_id()
);
create policy profiles_update_self on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_principal_teachers on public.profiles for update using (
  (select role from public.profiles where id = auth.uid()) = 'principal'
  and school_id = public.my_school_id() and role = 'teacher'
);

-- school-scoped tables
create policy classes_select on public.classes for select using (public.is_super_admin() or school_id = public.my_school_id());
create policy classes_write on public.classes for all using (
  (select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id()
) with check ((select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id());

create policy sections_select on public.sections for select using (public.is_super_admin() or school_id = public.my_school_id());
create policy sections_write on public.sections for all using (
  (select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id()
) with check ((select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id());

create policy subjects_select on public.subjects for select using (public.is_super_admin() or school_id = public.my_school_id());
create policy subjects_write on public.subjects for all using (
  (select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id()
) with check ((select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id());

create policy assign_select on public.teacher_assignments for select using (public.is_super_admin() or school_id = public.my_school_id());
create policy assign_write on public.teacher_assignments for all using (
  (select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id()
) with check ((select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id());

create policy students_select on public.students for select using (public.is_super_admin() or school_id = public.my_school_id());
create policy students_write on public.students for all using (
  (select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id()
) with check ((select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id());

create policy fee_struct_select on public.fee_structure for select using (public.is_super_admin() or school_id = public.my_school_id());
create policy fee_struct_write on public.fee_structure for all using (
  (select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id()
) with check ((select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id());

create policy invoices_select on public.fee_invoices for select using (public.is_super_admin() or school_id = public.my_school_id());
create policy invoices_write on public.fee_invoices for all using (
  (select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id()
) with check ((select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id());

create policy payments_select on public.payments for select using (public.is_super_admin() or school_id = public.my_school_id());
create policy payments_write on public.payments for all using (
  (select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id()
) with check ((select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id());

create policy exams_select on public.exams for select using (public.is_super_admin() or school_id = public.my_school_id());
create policy exams_write on public.exams for all using (
  (select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id()
) with check ((select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id());

create policy marks_select on public.marks for select using (public.is_super_admin() or school_id = public.my_school_id());
create policy marks_teacher on public.marks for all using (
  school_id = public.my_school_id() and (select role from public.profiles where id = auth.uid()) = 'teacher'
) with check (
  school_id = public.my_school_id() and (select role from public.profiles where id = auth.uid()) = 'teacher'
);

create policy attendance_select on public.attendance for select using (public.is_super_admin() or school_id = public.my_school_id());
create policy attendance_write on public.attendance for all using (
  school_id = public.my_school_id() and (select role from public.profiles where id = auth.uid()) in ('principal','teacher')
) with check (
  school_id = public.my_school_id() and (select role from public.profiles where id = auth.uid()) in ('principal','teacher')
);

create policy announcements_select on public.announcements for select using (public.is_super_admin() or school_id = public.my_school_id());
create policy announcements_write on public.announcements for all using (
  (select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id()
) with check ((select role from public.profiles where id = auth.uid()) = 'principal' and school_id = public.my_school_id());

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.create_school to authenticated;
grant execute on function public.set_school_active to authenticated;
grant execute on function public.create_teacher to authenticated;
grant execute on function public.create_school_staff to authenticated;
grant execute on function public.set_staff_active to authenticated;
grant execute on function public.set_teacher_active to authenticated;
grant execute on function public.generate_invoices to authenticated;
grant execute on function public.collect_fee to authenticated;
grant execute on function public.delete_payment to authenticated;
