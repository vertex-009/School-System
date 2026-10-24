-- Add email column to profiles and other_employees tables.
-- Run in Supabase SQL Editor.

-- 1. Add email column to public.profiles
alter table public.profiles add column if not exists email text;

-- 2. Add email column to public.other_employees
alter table public.other_employees add column if not exists email text;

-- 3. Backfill email for existing staff/teachers from auth.users
update public.profiles p
set email = lower(u.email)
from auth.users u
where p.id = u.id and (p.email is null or p.email = '');

-- 4. Update auth trigger to automatically populate email in profiles on new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role, school_id, phone, email, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'teacher'),
    nullif(new.raw_user_meta_data->>'school_id', '')::uuid,
    nullif(new.raw_user_meta_data->>'phone', ''),
    lower(new.email),
    true
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- 5. Update create_teacher to save email into profiles directly
create or replace function public.create_teacher(
  p_name text,
  p_email text,
  p_password text,
  p_phone text,
  p_cnic text default null
)
returns uuid language plpgsql security definer set search_path = public, auth, extensions as $$
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
  if v_school is null then raise exception 'No school assigned'; end if;

  if length(p_password) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;

  v_email := lower(trim(coalesce(p_email, '')));
  if v_email = '' or v_email not like '%@%' then
    raise exception 'Valid email is required';
  end if;

  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Email % is already registered. Please use another email.', p_email;
  end if;

  v_cnic := nullif(regexp_replace(coalesce(p_cnic,''), '\D', '', 'g'), '');
  if v_cnic is null or length(v_cnic) <> 13 then
    raise exception 'CNIC must be 13 digits (format: 12345-1234567-1)';
  end if;

  if exists (select 1 from public.profiles where school_id = v_school and cnic = v_cnic) then
    raise exception 'CNIC % is already registered for another teacher/staff member', p_cnic;
  end if;

  v_user := public._create_auth_user(
    v_email,
    p_password,
    jsonb_build_object('name', trim(p_name), 'role', 'teacher', 'school_id', v_school::text, 'phone', coalesce(p_phone,''))
  );

  update public.profiles
  set school_id = v_school, role = 'teacher', name = trim(p_name), phone = nullif(trim(p_phone),''), cnic = v_cnic, email = v_email
  where id = v_user;

  return v_user;
end;
$$;

-- 6. Update create_school_staff to save email into profiles directly
create or replace function public.create_school_staff(
  p_name text,
  p_email text,
  p_password text,
  p_phone text,
  p_role text,
  p_cnic text default null
)
returns uuid language plpgsql security definer set search_path = public, auth, extensions as $$
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
  if v_school is null then raise exception 'No school assigned'; end if;

  if length(p_password) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;

  v_email := lower(trim(coalesce(p_email, '')));
  if v_email = '' or v_email not like '%@%' then
    raise exception 'Valid email is required';
  end if;

  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Email % is already registered. Please use another email.', p_email;
  end if;

  v_cnic := nullif(regexp_replace(coalesce(p_cnic,''), '\D', '', 'g'), '');
  if v_cnic is null or length(v_cnic) <> 13 then
    raise exception 'CNIC must be 13 digits (format: 12345-1234567-1)';
  end if;

  if exists (select 1 from public.profiles where school_id = v_school and cnic = v_cnic) then
    raise exception 'CNIC % is already registered for another staff member', p_cnic;
  end if;

  v_user := public._create_auth_user(
    v_email,
    p_password,
    jsonb_build_object('name', trim(p_name), 'role', p_role, 'school_id', v_school::text, 'phone', coalesce(p_phone,''))
  );

  update public.profiles
  set school_id = v_school, role = p_role, name = trim(p_name), phone = nullif(trim(p_phone),''), cnic = v_cnic, email = v_email
  where id = v_user;

  return v_user;
end;
$$;

