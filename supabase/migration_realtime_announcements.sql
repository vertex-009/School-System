-- Enable Supabase Realtime for announcements table so client browsers receive live inserts.
-- Run in Supabase SQL Editor.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'announcements'
  ) then
    alter publication supabase_realtime add table public.announcements;
  end if;
end $$;

