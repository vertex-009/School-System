-- Timetable: settings + generated slots. Run after schema + roles migrations.

create table if not exists public.timetable_settings (
  school_id uuid primary key references public.schools(id) on delete cascade,
  day_start time not null default '08:00',
  day_end time not null default '14:00',
  period_minutes int not null default 40 check (period_minutes between 20 and 90),
  break_after_period int not null default 4 check (break_after_period between 0 and 12),
  break_minutes int not null default 15 check (break_minutes between 0 and 60),
  working_days int not null default 6 check (working_days between 1 and 6),
  periods_per_day int not null default 7 check (periods_per_day between 1 and 12),
  num_rooms int not null default 8 check (num_rooms between 1 and 50),
  max_teacher_periods_per_day int not null default 6 check (max_teacher_periods_per_day between 1 and 12),
  periods_per_subject_week int not null default 4 check (periods_per_subject_week between 1 and 10),
  generated_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  section_id uuid not null references public.sections(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  -- Optional link to a real profile; capacity uses teacher_slot (1..N) from principal count.
  teacher_id uuid references public.profiles(id) on delete set null,
  teacher_slot int not null default 1,
  day_of_week int not null check (day_of_week between 1 and 6),
  period_number int not null check (period_number between 1 and 12),
  room_number int not null default 1,
  unique (school_id, section_id, day_of_week, period_number),
  unique (school_id, teacher_slot, day_of_week, period_number)
);

create index if not exists idx_timetable_slots_teacher on public.timetable_slots(school_id, teacher_id);
create index if not exists idx_timetable_slots_section on public.timetable_slots(school_id, section_id);

alter table public.timetable_settings enable row level security;
alter table public.timetable_slots enable row level security;

drop policy if exists timetable_settings_select on public.timetable_settings;
drop policy if exists timetable_settings_write on public.timetable_settings;
drop policy if exists timetable_slots_select on public.timetable_slots;
drop policy if exists timetable_slots_write on public.timetable_slots;

create policy timetable_settings_select on public.timetable_settings for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy timetable_settings_write on public.timetable_settings for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'principal'
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'principal'
);

create policy timetable_slots_select on public.timetable_slots for select using (
  public.is_super_admin() or school_id = public.my_school_id()
);
create policy timetable_slots_write on public.timetable_slots for all using (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'principal'
) with check (
  school_id = public.my_school_id()
  and (select role from public.profiles where id = auth.uid()) = 'principal'
);

grant select, insert, update, delete on public.timetable_settings to authenticated;
grant select, insert, update, delete on public.timetable_slots to authenticated;
