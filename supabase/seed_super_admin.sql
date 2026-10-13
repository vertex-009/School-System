-- Run once in Supabase SQL Editor after schema.sql
-- Super Admin login for local / testing

update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
    || '{"name":"Super Admin","role":"super_admin"}'::jsonb
where email = 'admin@schoolsms.com';

insert into public.profiles (id, name, role, school_id, is_active)
select id, 'Super Admin', 'super_admin', null, true
from auth.users
where email = 'admin@schoolsms.com'
on conflict (id) do update
set name = excluded.name,
    role = 'super_admin',
    school_id = null,
    is_active = true;
