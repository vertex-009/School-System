-- Optional: add Finance + Accountant to an EXISTING school
-- 1) Change emails/passwords/school_id below
-- 2) Run AFTER migration_roles_finance.sql

-- Find your school id:
-- select id, name from public.schools;

do $$
declare
  v_school uuid := (select id from public.schools order by created_at desc limit 1);
  v_fin uuid;
  v_acc uuid;
begin
  if v_school is null then raise exception 'No school found'; end if;

  v_fin := public._create_auth_user(
    'finance@schoolsms.com',
    'Finance123',
    jsonb_build_object('name', 'Finance', 'role', 'finance', 'school_id', v_school::text)
  );
  update public.profiles set school_id = v_school, role = 'finance', name = 'Finance', is_active = true where id = v_fin;

  v_acc := public._create_auth_user(
    'accountant@schoolsms.com',
    'Account123',
    jsonb_build_object('name', 'Accountant', 'role', 'accountant', 'school_id', v_school::text)
  );
  update public.profiles set school_id = v_school, role = 'accountant', name = 'Accountant', is_active = true where id = v_acc;
end $$;
