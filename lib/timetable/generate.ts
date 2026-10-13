export type TimetableSettingsInput = {
  working_days: number;
  periods_per_day: number;
  break_after_period: number;
  periods_per_subject_week: number;
  num_rooms: number;
  max_teacher_periods_per_day: number;
  reserved?: GeneratedSlot[];
};

export type AssignmentRow = {
  section_id: string;
  subject_id: string;
  teacher_id: string;
};

export type GeneratedSlot = {
  section_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: number;
  period_number: number;
  room_number: number;
};

export type SectionSubjectPlan = {
  section_id: string;
  /** Ordered subjects for this section/class — period 1..N each day */
  subject_ids: string[];
};

type Task = AssignmentRow & { day_of_week: number; period_number: number };

function keySection(day: number, period: number, sectionId: string) {
  return `${sectionId}:${day}:${period}`;
}
function keyTeacher(day: number, period: number, teacherId: string) {
  return `${teacherId}:${day}:${period}`;
}
function keyRoom(day: number, period: number, room: number) {
  return `${room}:${day}:${period}`;
}

/** Build virtual teacher pool from a count (no registered faculty required). */
export function teacherPoolFromCount(count: number): string[] {
  const n = Math.max(1, Math.min(80, Math.floor(count)));
  return Array.from({ length: n }, (_, i) => String(i + 1));
}

/** @deprecated kept for compatibility — prefer generateDailyAllSubjects */
export function buildAssignmentsFromPool(
  sectionIds: string[],
  subjectIds: string[],
  teacherIds: string[]
): AssignmentRow[] {
  if (!sectionIds.length || !subjectIds.length || !teacherIds.length) return [];
  const rows: AssignmentRow[] = [];
  for (let si = 0; si < subjectIds.length; si++) {
    const subject_id = subjectIds[si];
    const teacher_id = teacherIds[si % teacherIds.length];
    for (const section_id of sectionIds) {
      rows.push({ section_id, subject_id, teacher_id });
    }
  }
  return rows;
}

/**
 * Every subject of a class runs every working day.
 * 8 subjects × 6 days = 8 periods/day, 6 days/week.
 * Different classes may have different subject counts.
 */
export function generateDailyAllSubjects(
  plans: SectionSubjectPlan[],
  teacherIds: string[],
  settings: {
    working_days: number;
    num_rooms: number;
    max_teacher_periods_per_day: number;
    reserved?: GeneratedSlot[];
  }
): { slots: GeneratedSlot[]; unplaced: Task[] } {
  const { working_days, num_rooms, reserved = [] } = settings;
  const maxDay = Math.max(
    settings.max_teacher_periods_per_day,
    ...plans.map((p) => p.subject_ids.length),
    1
  );

  const usedSection = new Set<string>();
  const usedTeacher = new Set<string>();
  const usedRoom = new Set<string>();
  const teacherDayCount = new Map<string, number>();

  for (const row of reserved) {
    usedSection.add(keySection(row.day_of_week, row.period_number, row.section_id));
    usedTeacher.add(keyTeacher(row.day_of_week, row.period_number, row.teacher_id));
    usedRoom.add(keyRoom(row.day_of_week, row.period_number, row.room_number));
    const tDayKey = `${row.teacher_id}:${row.day_of_week}`;
    teacherDayCount.set(tDayKey, (teacherDayCount.get(tDayKey) || 0) + 1);
  }

  const slots: GeneratedSlot[] = [];
  const unplaced: Task[] = [];
  if (!teacherIds.length) return { slots, unplaced };

  // Stable teacher per subject name index across school (round-robin).
  const subjectTeacher = new Map<string, string>();
  let subjectSeq = 0;
  for (const plan of plans) {
    for (const sid of plan.subject_ids) {
      if (!subjectTeacher.has(sid)) {
        subjectTeacher.set(sid, teacherIds[subjectSeq % teacherIds.length]);
        subjectSeq += 1;
      }
    }
  }

  for (const plan of plans) {
    const subjects = plan.subject_ids;
    for (let day = 1; day <= working_days; day++) {
      for (let i = 0; i < subjects.length; i++) {
        const period = i + 1;
        const subject_id = subjects[i];
        const preferred = subjectTeacher.get(subject_id) || teacherIds[0];
        const order = [preferred, ...teacherIds.filter((t) => t !== preferred)];

        let placed = false;
        for (const teacher_id of order) {
          const tDayKey = `${teacher_id}:${day}`;
          if ((teacherDayCount.get(tDayKey) || 0) >= maxDay) continue;
          const secKey = keySection(day, period, plan.section_id);
          const teaKey = keyTeacher(day, period, teacher_id);
          if (usedSection.has(secKey) || usedTeacher.has(teaKey)) continue;

          let room = 0;
          for (let r = 1; r <= Math.max(1, num_rooms); r++) {
            const rk = keyRoom(day, period, r);
            if (!usedRoom.has(rk)) {
              room = r;
              break;
            }
          }
          if (!room) continue;

          usedSection.add(secKey);
          usedTeacher.add(teaKey);
          usedRoom.add(keyRoom(day, period, room));
          teacherDayCount.set(tDayKey, (teacherDayCount.get(tDayKey) || 0) + 1);

          slots.push({
            section_id: plan.section_id,
            subject_id,
            teacher_id,
            day_of_week: day,
            period_number: period,
            room_number: room,
          });
          placed = true;
          break;
        }
        if (!placed) {
          unplaced.push({
            section_id: plan.section_id,
            subject_id,
            teacher_id: preferred,
            day_of_week: day,
            period_number: period,
          });
        }
      }
    }
  }

  return { slots, unplaced };
}

/** @deprecated prefer generateDailyAllSubjects */
export function generateTimetable(
  assignments: AssignmentRow[],
  settings: TimetableSettingsInput
): { slots: GeneratedSlot[]; unplaced: AssignmentRow[] } {
  const plansMap = new Map<string, string[]>();
  const teacherIds = Array.from(new Set(assignments.map((a) => a.teacher_id)));
  for (const a of assignments) {
    const list = plansMap.get(a.section_id) || [];
    if (!list.includes(a.subject_id)) list.push(a.subject_id);
    plansMap.set(a.section_id, list);
  }
  const plans = Array.from(plansMap.entries()).map(([section_id, subject_ids]) => ({ section_id, subject_ids }));
  const { slots, unplaced } = generateDailyAllSubjects(plans, teacherIds, {
    working_days: settings.working_days,
    num_rooms: settings.num_rooms,
    max_teacher_periods_per_day: settings.max_teacher_periods_per_day,
    reserved: settings.reserved,
  });
  return { slots, unplaced: unplaced.map(({ day_of_week: _d, period_number: _p, ...rest }) => rest) };
}
