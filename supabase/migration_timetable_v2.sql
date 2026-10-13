-- Timetable v2: draft/publish, per-day schedules, class subjects, teacher slot meta.
-- Run AFTER migration_timetable.sql + migration_timetable_teacher_count.sql.
-- Existing timetable_slots become draft (teachers see nothing until Principal publishes).

alter table public.timetable_settings
  add column if not exists day_schedules jsonb,
  add column if not exists teacher_slot_mode text not null default 'subject_wise',
  add column if not exists teacher_count int,
  add column if not exists teacher_count_auto boolean not null default true,
  add column if not exists special_rooms jsonb not null default '[]'::jsonb,
  add column if not exists status text not null default 'draft',
  add column if not exists rotation_enabled boolean not null default true;

alter table public.timetable_settings
  drop constraint if exists timetable_settings_status_check;
alter table public.timetable_settings
  add constraint timetable_settings_status_check
  check (status in ('draft', 'published'));

alter table public.timetable_settings
  drop constraint if exists timetable_settings_teacher_slot_mode_check;
alter table public.timetable_settings
  add constraint timetable_settings_teacher_slot_mode_check
  check (teacher_slot_mode in ('subject_wise', 'mixed'));

-- Default day schedules if null (Mon–Thu+Sat 08:00–14:00, Fri 08:00–11:00)
update public.timetable_settings
set day_schedules = jsonb_build_object(
  '1', jsonb_build_object('start','08:00','end','14:00','break_after',4,'break_minutes',20),
  '2', jsonb_build_object('start','08:00','end','14:00','break_after',4,'break_minutes',20),
  '3', jsonb_build_object('start','08:00','end','14:00','break_after',4,'break_minutes',20),
  '4', jsonb_build_object('start','08:00','end','14:00','break_after',4,'break_minutes',20),
  '5', jsonb_build_object('start','08:00','end','11:00','break_after',2,'break_minutes',20),
  '6', jsonb_build_object('start','08:00','end','14:00','break_after',4,'break_minutes',20)
)
where day_schedules is null;

alter table public.timetable_slots
  add column if not exists locked boolean not null default false,
  add column if not exists is_free boolean not null default false,
  add column if not exists plan_status text not null default 'draft';

alter table public.timetable_slots
  drop constraint if exists timetable_slots_plan_status_check;
alter table public.timetable_slots
  add constraint timetable_slots_plan_status_check
  check (plan_status in ('draft', 'published'));

update public.timetable_slots set plan_status = 'draft' where plan_status is distinct from 'draft' and plan_status is distinct from 'published';

create table if not exists public.timetable_class_subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  subject_name text not null,
  sort_order int not null default 0,
  unique (school_id, section_id, subject_name)
);

create index if not exists idx_tt_class_subjects_section
  on public.timetable_class_subjects (school_id, section_id, sort_order);

create table if not exists public.timetable_teacher_slots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  slot_no int not null check (slot_no between 1 and 80),
  subject_id uuid references public.subjects(id) on delete set null,
  subject_name text,
  label text,
  unique (school_id, slot_no)
);

alter table public.timetable_class_subjects enable row level security;
alter table public.timetable_teacher_slots enable row level security;

drop policy if exists tt_class_subjects_select on public.timetable_class_subjects;
drop policy if exists tt_class_subjects_write on public.timetable_class_subjects;
create policy tt_class_subjects_select on public.timetable_class_subjects for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy tt_class_subjects_write on public.timetable_class_subjects for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'principal'
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'principal'
);

drop policy if exists tt_teacher_slots_select on public.timetable_teacher_slots;
drop policy if exists tt_teacher_slots_write on public.timetable_teacher_slots;
create policy tt_teacher_slots_select on public.timetable_teacher_slots for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy tt_teacher_slots_write on public.timetable_teacher_slots for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'principal'
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'principal'
);

-- Teachers: only published slots for own school (tighten select)
drop policy if exists timetable_slots_select on public.timetable_slots;
create policy timetable_slots_select on public.timetable_slots for select using (
  public.is_super_admin()
  or (
    school_id = public.my_school_id()
    and (
      (select role from public.profiles where id = auth.uid()) = 'principal'
      or (
        (select role from public.profiles where id = auth.uid()) = 'teacher'
        and plan_status = 'published'
        and teacher_id = auth.uid()
      )
      or (select role from public.profiles where id = auth.uid()) in ('finance', 'accountant')
    )
  )
);

drop policy if exists timetable_settings_select on public.timetable_settings;
create policy timetable_settings_select on public.timetable_settings for select using (
  public.is_super_admin()
  or (
    school_id = public.my_school_id()
    and (
      (select role from public.profiles where id = auth.uid()) = 'principal'
      or status = 'published'
    )
  )
);

grant select, insert, update, delete on public.timetable_class_subjects to authenticated;
grant select, insert, update, delete on public.timetable_teacher_slots to authenticated;
