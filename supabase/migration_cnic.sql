-- CNIC required for students and staff profiles. Run in Supabase SQL Editor.

alter table public.students add column if not exists cnic text;
alter table public.profiles add column if not exists cnic text;

create unique index if not exists students_school_cnic_uidx
  on public.students (school_id, cnic)
  where cnic is not null;

create unique index if not exists profiles_school_cnic_uidx
  on public.profiles (school_id, cnic)
  where cnic is not null;

create or replace function public.create_teacher(p_name text, p_email text, p_password text, p_phone text, p_cnic text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_school uuid; v_user uuid; v_cnic text;
begin
  if (select role from public.profiles where id = auth.uid()) <> 'principal' then raise exception 'Only Principal'; end if;
  v_school := public.my_school_id();
  if v_school is null then raise exception 'No school'; end if;
  if length(p_password) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  v_cnic := nullif(regexp_replace(coalesce(p_cnic,''), '\D', '', 'g'), '');
  if v_cnic is null or length(v_cnic) <> 13 then raise exception 'CNIC must be 13 digits'; end if;
  v_user := public._create_auth_user(p_email, p_password, jsonb_build_object('name', trim(p_name), 'role', 'teacher', 'school_id', v_school::text, 'phone', coalesce(p_phone,'')));
  update public.profiles
  set school_id = v_school, role = 'teacher', name = trim(p_name), phone = nullif(trim(p_phone),''), cnic = v_cnic
  where id = v_user;
  return v_user;
end;
$$;

create or replace function public.create_school_staff(
  p_name text, p_email text, p_password text, p_phone text, p_role text, p_cnic text default null
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_school uuid; v_user uuid; v_cnic text;
begin
  if (select role from public.profiles where id = auth.uid()) <> 'principal' then raise exception 'Only Principal'; end if;
  if p_role not in ('finance', 'accountant') then raise exception 'Role must be finance or accountant'; end if;
  v_school := public.my_school_id();
  if v_school is null then raise exception 'No school'; end if;
  if length(p_password) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  v_cnic := nullif(regexp_replace(coalesce(p_cnic,''), '\D', '', 'g'), '');
  if v_cnic is null or length(v_cnic) <> 13 then raise exception 'CNIC must be 13 digits'; end if;
  v_user := public._create_auth_user(
    p_email, p_password,
    jsonb_build_object('name', trim(p_name), 'role', p_role, 'school_id', v_school::text, 'phone', coalesce(p_phone,''))
  );
  update public.profiles
  set school_id = v_school, role = p_role, name = trim(p_name), phone = nullif(trim(p_phone),''), cnic = v_cnic
  where id = v_user;
  return v_user;
end;
$$;
