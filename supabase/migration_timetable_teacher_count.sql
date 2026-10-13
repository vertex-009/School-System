-- Allow timetable by teacher COUNT (not registered faculty).
-- Run once in Supabase SQL Editor after migration_timetable.sql

alter table public.timetable_slots
  add column if not exists teacher_slot int;

update public.timetable_slots
set teacher_slot = coalesce(teacher_slot, 1)
where teacher_slot is null;

alter table public.timetable_slots
  alter column teacher_slot set not null;

alter table public.timetable_slots
  alter column teacher_id drop not null;

-- Old unique blocked capacity to real faculty rows only
alter table public.timetable_slots
  drop constraint if exists timetable_slots_school_id_teacher_id_day_of_week_period_number_key;

alter table public.timetable_slots
  drop constraint if exists timetable_slots_teacher_slot_unique;

alter table public.timetable_slots
  add constraint timetable_slots_teacher_slot_unique
  unique (school_id, teacher_slot, day_of_week, period_number);
