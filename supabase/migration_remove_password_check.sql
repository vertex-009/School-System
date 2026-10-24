-- Migration: Remove password length constraint for Teachers and Staff
-- Allows any password without blocking on minimum 8 characters

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

  if length(trim(coalesce(p_password, ''))) < 1 then
    raise exception 'Password is required';
  end if;

  v_email := lower(trim(coalesce(p_email, '')));
  if v_email = '' or v_email not like '%@%' then
    raise exception 'Valid email is required';
  end if;

  -- Check duplicate email in auth
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Email % is already registered. Please use another email.', p_email;
  end if;

  v_cnic := nullif(regexp_replace(coalesce(p_cnic,''), '\D', '', 'g'), '');
  if v_cnic is null or length(v_cnic) <> 13 then
    raise exception 'CNIC must be 13 digits (format: 12345-1234567-1)';
  end if;

  -- Check duplicate CNIC in profiles
  if exists (select 1 from public.profiles where school_id = v_school and cnic = v_cnic) then
    raise exception 'CNIC % is already registered for another teacher/staff member', p_cnic;
  end if;

  -- Check duplicate CNIC in other_employees
  if exists (select 1 from public.other_employees where school_id = v_school and cnic = v_cnic) then
    raise exception 'CNIC % is already registered for an employee', p_cnic;
  end if;

  -- Check duplicate CNIC in students
  if exists (select 1 from public.students where school_id = v_school and cnic = v_cnic) then
    raise exception 'CNIC % is already registered for a student', p_cnic;
  end if;

  v_user := public._create_auth_user(
    v_email,
    p_password,
    jsonb_build_object('name', trim(p_name), 'role', 'teacher', 'school_id', v_school::text, 'phone', coalesce(p_phone,''))
  );

  update public.profiles
  set school_id = v_school, role = 'teacher', name = trim(p_name), phone = nullif(trim(p_phone),''), cnic = v_cnic
  where id = v_user;

  return v_user;
end;
$$;

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

  if length(trim(coalesce(p_password, ''))) < 1 then
    raise exception 'Password is required';
  end if;

  v_email := lower(trim(coalesce(p_email, '')));
  if v_email = '' or v_email not like '%@%' then
    raise exception 'Valid email is required';
  end if;

  -- Check duplicate email in auth
  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'Email % is already registered. Please use another email.', p_email;
  end if;

  v_cnic := nullif(regexp_replace(coalesce(p_cnic,''), '\D', '', 'g'), '');
  if v_cnic is null or length(v_cnic) <> 13 then
    raise exception 'CNIC must be 13 digits (format: 12345-1234567-1)';
  end if;

  -- Check duplicate CNIC in profiles
  if exists (select 1 from public.profiles where school_id = v_school and cnic = v_cnic) then
    raise exception 'CNIC % is already registered for another staff member', p_cnic;
  end if;

  -- Check duplicate CNIC in other_employees
  if exists (select 1 from public.other_employees where school_id = v_school and cnic = v_cnic) then
    raise exception 'CNIC % is already registered for an employee', p_cnic;
  end if;

  -- Check duplicate CNIC in students
  if exists (select 1 from public.students where school_id = v_school and cnic = v_cnic) then
    raise exception 'CNIC % is already registered for a student', p_cnic;
  end if;

  v_user := public._create_auth_user(
    v_email,
    p_password,
    jsonb_build_object('name', trim(p_name), 'role', p_role, 'school_id', v_school::text, 'phone', coalesce(p_phone,''))
  );

  update public.profiles
  set school_id = v_school, role = p_role, name = trim(p_name), phone = nullif(trim(p_phone),''), cnic = v_cnic
  where id = v_user;

  return v_user;
end;
$$;

