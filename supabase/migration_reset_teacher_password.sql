-- Migration: Allow Finance & Principal to Create Teachers and Reset Teacher Passwords

-- 1. Update create_teacher RPC to allow Principal, Finance, and Super Admin
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
  v_caller_role text;
begin
  select role into v_caller_role from public.profiles where id = auth.uid();
  if v_caller_role not in ('principal', 'finance', 'super_admin') then
    raise exception 'Only Principal or Finance can add teachers';
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

grant execute on function public.create_teacher(text, text, text, text, text) to authenticated;

-- 2. Add reset_teacher_password RPC allowing Principal and Finance
create or replace function public.reset_teacher_password(
  p_teacher_id uuid,
  p_new_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_school uuid;
  v_caller_role text;
  v_target_role text;
begin
  select school_id, role into v_school, v_caller_role
  from public.profiles
  where id = auth.uid();

  if v_caller_role not in ('principal', 'finance', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Only Principal or Finance can reset password');
  end if;

  select role into v_target_role
  from public.profiles
  where id = p_teacher_id and school_id = v_school;

  if v_target_role is null then
    return jsonb_build_object('ok', false, 'error', 'Staff member not found in your school');
  end if;

  if length(coalesce(p_new_password, '')) < 8 then
    return jsonb_build_object('ok', false, 'error', 'Password must be at least 8 characters');
  end if;

  update auth.users
  set encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  where id = p_teacher_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.reset_teacher_password(uuid, text) to authenticated;
