-- ==============================================================================
-- Comprehensive SQL Migration for School Management System (SMS)
-- Fixes:
--  1. Add Finance Staff / Accountant (create_school_staff function with CNIC)
--  2. Add Student (CNIC / Form B column + auto-healing missing class sections)
--  3. Teacher-to-Teacher Announcements (target_teacher_id + audience check)
--  4. Salary Receipt & Printable Voucher Metadata
--  5. Fee Collection Editable Amount & Discounts (discount columns)
--  6. Fast Search Indexes for Autocomplete
--
-- Safe to execute in Supabase SQL Editor (Idempotent: will not damage existing data).
-- ==============================================================================

-- Enable pgcrypto extension if not already enabled
create extension if not exists "pgcrypto" with schema extensions;

-- -----------------------------------------------------------------------------
-- 1. Table Columns: CNIC, Contact & Profile Metadata
-- -----------------------------------------------------------------------------
alter table public.students
  add column if not exists cnic text,
  add column if not exists photo_url text;

alter table public.profiles
  add column if not exists cnic text,
  add column if not exists email text,
  add column if not exists joined_on text,
  add column if not exists left_on text;

alter table public.other_employees
  add column if not exists cnic text;

-- -----------------------------------------------------------------------------
-- 2. Announcements: Support Targeted Teacher Announcements
-- -----------------------------------------------------------------------------
alter table public.announcements
  add column if not exists target_teacher_id uuid references public.profiles(id) on delete set null;

alter table public.announcements
  drop constraint if exists announcements_audience_check;

alter table public.announcements
  add constraint announcements_audience_check
  check (audience in ('all', 'finance', 'teachers', 'teacher', 'principal'));

create index if not exists idx_announcements_target_teacher
  on public.announcements (target_teacher_id);

-- -----------------------------------------------------------------------------
-- 3. Payments & Invoices: Discounts & Receipt Metadata
-- -----------------------------------------------------------------------------
alter table public.payments
  add column if not exists received_from text,
  add column if not exists received_by text;

alter table public.fee_invoices
  add column if not exists discount numeric(10,2) default 0,
  add column if not exists discount_reason text;

-- -----------------------------------------------------------------------------
-- 4. Sections Auto-Healing: Ensure every class has at least one default section
-- -----------------------------------------------------------------------------
insert into public.sections (school_id, class_id, name)
select c.school_id, c.id, '-'
from public.classes c
where not exists (
  select 1 from public.sections s where s.class_id = c.id
)
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 5. Helper Function: _create_auth_user (Required for adding staff & teachers)
-- -----------------------------------------------------------------------------
create or replace function public._create_auth_user(
  p_email text,
  p_password text,
  p_meta jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_id uuid := gen_random_uuid();
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Email % is already registered. Please use another email.', p_email;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
    v_email, crypt(p_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, coalesce(p_meta, '{}'::jsonb),
    now(), now(), '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    v_id, v_id,
    jsonb_build_object('sub', v_id::text, 'email', v_email),
    'email', v_id::text, now(), now(), now()
  );

  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. Dynamically Drop All Overloaded Signatures of create_school_staff & create_teacher
-- This eliminates PostgreSQL Error 42725 (function name is not unique)
-- -----------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in (
    select p.oid::regprocedure::text as func_sig
    from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public' and p.proname in ('create_school_staff', 'create_teacher')
  ) loop
    execute 'drop function if exists ' || r.func_sig || ' cascade';
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 7. RPC: create_school_staff (Principal adds Finance / Accountant)
-- -----------------------------------------------------------------------------
create or replace function public.create_school_staff(
  p_name text,
  p_email text,
  p_password text,
  p_phone text,
  p_role text,
  p_cnic text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_school uuid;
  v_user uuid;
  v_cnic text;
  v_email text;
begin
  if (select role from public.profiles where id = auth.uid()) <> 'principal' then
    raise exception 'Only Principal can add staff';
  end if;

  if p_role not in ('finance', 'accountant') then
    raise exception 'Role must be finance or accountant';
  end if;

  v_school := public.my_school_id();
  if v_school is null then
    raise exception 'No school assigned';
  end if;

  if length(p_password) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;

  v_email := lower(trim(coalesce(p_email, '')));
  if v_email = '' or v_email not like '%@%' then
    raise exception 'Valid email is required';
  end if;

  -- Validate CNIC format (13 digits if provided)
  v_cnic := nullif(regexp_replace(coalesce(p_cnic,''), '\D', '', 'g'), '');
  if v_cnic is not null and length(v_cnic) <> 13 then
    raise exception 'CNIC must be 13 digits (format: 12345-1234567-1)';
  end if;

  -- Create Auth User
  v_user := public._create_auth_user(
    v_email,
    p_password,
    jsonb_build_object('name', trim(p_name), 'role', p_role, 'school_id', v_school::text, 'phone', coalesce(p_phone,''))
  );

  -- Upsert Profile
  update public.profiles
  set
    school_id = v_school,
    role = p_role,
    name = trim(p_name),
    phone = nullif(trim(p_phone),''),
    cnic = v_cnic,
    email = v_email,
    is_active = true
  where id = v_user;

  return v_user;
end;
$$;

grant execute on function public.create_school_staff(text, text, text, text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 8. RPC: create_teacher (Principal adds Teachers)
-- -----------------------------------------------------------------------------
create or replace function public.create_teacher(
  p_name text,
  p_email text,
  p_password text,
  p_phone text,
  p_cnic text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_school uuid;
  v_user uuid;
  v_cnic text;
  v_email text;
begin
  if (select role from public.profiles where id = auth.uid()) <> 'principal' then
    raise exception 'Only Principal can add teachers';
  end if;

  v_school := public.my_school_id();
  if v_school is null then
    raise exception 'No school assigned';
  end if;

  if length(p_password) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;

  v_email := lower(trim(coalesce(p_email, '')));
  if v_email = '' or v_email not like '%@%' then
    raise exception 'Valid email is required';
  end if;

  -- Validate CNIC format (13 digits if provided)
  v_cnic := nullif(regexp_replace(coalesce(p_cnic,''), '\D', '', 'g'), '');
  if v_cnic is not null and length(v_cnic) <> 13 then
    raise exception 'CNIC must be 13 digits (format: 12345-1234567-1)';
  end if;

  -- Create Auth User
  v_user := public._create_auth_user(
    v_email,
    p_password,
    jsonb_build_object('name', trim(p_name), 'role', 'teacher', 'school_id', v_school::text, 'phone', coalesce(p_phone,''))
  );

  -- Upsert Profile
  update public.profiles
  set
    school_id = v_school,
    role = 'teacher',
    name = trim(p_name),
    phone = nullif(trim(p_phone),''),
    cnic = v_cnic,
    email = v_email,
    is_active = true
  where id = v_user;

  return v_user;
end;
$$;

grant execute on function public.create_teacher(text, text, text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 9. Unique Indexes on CNIC per School (Preventing Duplicates)
-- -----------------------------------------------------------------------------
create unique index if not exists idx_profiles_school_cnic_uidx
  on public.profiles (school_id, cnic)
  where cnic is not null and cnic <> '';

create unique index if not exists idx_students_school_cnic_uidx
  on public.students (school_id, cnic)
  where cnic is not null and cnic <> '';

create unique index if not exists idx_other_employees_school_cnic_uidx
  on public.other_employees (school_id, cnic)
  where cnic is not null and cnic <> '';

-- -----------------------------------------------------------------------------
-- 10. Fast Search Indexes for Instant Autocomplete
-- -----------------------------------------------------------------------------
create index if not exists idx_students_search_name
  on public.students (school_id, name);

create index if not exists idx_students_search_father
  on public.students (school_id, father_name);

create index if not exists idx_students_search_admission
  on public.students (school_id, admission_no);

create index if not exists idx_students_search_roll
  on public.students (school_id, roll_no);
