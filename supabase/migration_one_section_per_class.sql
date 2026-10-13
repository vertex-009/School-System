-- Collapse Section A/B into one roster unit per class. Run once in Supabase SQL Editor.

-- Prefer keeping section named '-' or the alphabetically first section as primary.
with ranked as (
  select
    id,
    class_id,
    row_number() over (
      partition by class_id
      order by case when name = '-' then 0 else 1 end, name, id
    ) as rn
  from public.sections
),
primary_map as (
  select id as keep_id, class_id from ranked where rn = 1
),
dupes as (
  select r.id as drop_id, p.keep_id
  from ranked r
  join primary_map p on p.class_id = r.class_id
  where r.rn > 1
)
update public.students s
set section_id = d.keep_id
from dupes d
where s.section_id = d.drop_id;

with ranked as (
  select
    id,
    class_id,
    row_number() over (
      partition by class_id
      order by case when name = '-' then 0 else 1 end, name, id
    ) as rn
  from public.sections
),
primary_map as (
  select id as keep_id, class_id from ranked where rn = 1
),
dupes as (
  select r.id as drop_id, p.keep_id
  from ranked r
  join primary_map p on p.class_id = r.class_id
  where r.rn > 1
)
update public.teacher_assignments ta
set section_id = d.keep_id
from dupes d
where ta.section_id = d.drop_id;

with ranked as (
  select
    id,
    class_id,
    row_number() over (
      partition by class_id
      order by case when name = '-' then 0 else 1 end, name, id
    ) as rn
  from public.sections
),
primary_map as (
  select id as keep_id, class_id from ranked where rn = 1
),
dupes as (
  select r.id as drop_id, p.keep_id
  from ranked r
  join primary_map p on p.class_id = r.class_id
  where r.rn > 1
)
update public.timetable_slots ts
set section_id = d.keep_id
from dupes d
where ts.section_id = d.drop_id;

-- Drop duplicate sections (attendance rows on dupes may block; delete those first if needed)
delete from public.attendance a
using public.sections s
where a.section_id = s.id
  and s.id not in (
    select id from (
      select id, row_number() over (
        partition by class_id
        order by case when name = '-' then 0 else 1 end, name, id
      ) as rn
      from public.sections
    ) x where rn = 1
  );

delete from public.sections s
where s.id not in (
  select id from (
    select id, row_number() over (
      partition by class_id
      order by case when name = '-' then 0 else 1 end, name, id
    ) as rn
    from public.sections
  ) x where rn = 1
);

update public.sections set name = '-' where name is distinct from '-';
