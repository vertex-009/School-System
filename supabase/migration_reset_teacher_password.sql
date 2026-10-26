-- Migration: Add reset_teacher_password RPC
-- Allows Principal or Super Admin to set/reset a teacher's or staff's login password directly

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

  if v_caller_role not in ('principal', 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'Only Principal or Super Admin can reset password');
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
