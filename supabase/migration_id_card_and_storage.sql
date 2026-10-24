-- Run this once in the Supabase SQL Editor.
-- Sets up storage policies for ID card / photo uploads and ensures profile columns exist.

-- 1. Ensure required columns exist on public.profiles
alter table public.profiles add column if not exists photo_url text;
alter table public.profiles add column if not exists cnic text;
alter table public.profiles add column if not exists joined_on date default current_date;
alter table public.profiles add column if not exists left_on date;

-- 2. Ensure the public 'avatars' storage bucket exists
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 3. Storage Policies for avatars bucket (allows Principal to upload photos for teachers/finance)
drop policy if exists "avatars_select_public" on storage.objects;
create policy "avatars_select_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_insert_auth" on storage.objects;
create policy "avatars_insert_auth"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');

drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_update_auth" on storage.objects;
create policy "avatars_update_auth"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars');

drop policy if exists "avatars_delete_own" on storage.objects;
drop policy if exists "avatars_delete_auth" on storage.objects;
create policy "avatars_delete_auth"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars');

