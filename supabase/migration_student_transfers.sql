-- Student transfers (Finance only). Run once in Supabase SQL editor.
-- Supports: (1) whole-class move to another class  (2) single student leave to another school

create table if not exists public.student_transfers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  from_section_id uuid references public.sections(id) on delete set null,
  to_section_id uuid references public.sections(id) on delete set null,
  from_class_name text,
  to_class_name text,
  transfer_kind text not null default 'class' check (transfer_kind in ('class', 'external')),
  to_school_name text,
  reason text,
  transferred_by uuid references public.profiles(id) on delete set null,
  transferred_at timestamptz not null default now()
);

-- Safe upgrades if table already exists from an earlier version
alter table public.student_transfers alter column to_section_id drop not null;
alter table public.student_transfers add column if not exists transfer_kind text;
alter table public.student_transfers add column if not exists to_school_name text;

update public.student_transfers set transfer_kind = 'class' where transfer_kind is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'student_transfers_transfer_kind_check'
  ) then
    alter table public.student_transfers
      add constraint student_transfers_transfer_kind_check
      check (transfer_kind in ('class', 'external'));
  end if;
end $$;

alter table public.student_transfers alter column transfer_kind set default 'class';
alter table public.student_transfers alter column transfer_kind set not null;

create index if not exists idx_student_transfers_school_at
  on public.student_transfers (school_id, transferred_at desc);

create index if not exists idx_student_transfers_student
  on public.student_transfers (student_id, transferred_at desc);

alter table public.student_transfers enable row level security;

drop policy if exists transfers_select on public.student_transfers;
drop policy if exists transfers_write on public.student_transfers;

create policy transfers_select on public.student_transfers for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);

create policy transfers_write on public.student_transfers for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'finance'
);

grant select, insert on public.student_transfers to authenticated;
