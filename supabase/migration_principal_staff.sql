-- Run if create_school_staff is missing (after migration_roles_finance.sql)
-- Principal adds Finance / Accountant for their school

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

-- Super Admin school create = Principal only
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

grant execute on function public.create_school_staff to authenticated;
grant execute on function public.set_staff_active to authenticated;
