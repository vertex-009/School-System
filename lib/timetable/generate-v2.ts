import { checkFeasibility, minTeachersNeeded } from "@/lib/timetable/feasibility";
import { computeBell, mergeDaySchedules } from "@/lib/timetable/schedule";
import type {
  ClassSubjectPlan,
  GenerateResult,
  GeneratedLesson,
  GeneratorInput,
  VirtualTeacherSlot,
} from "@/lib/timetable/types";

type Edge = {
  id: string;
  section_id: string;
  subject_name: string;
  teacher_slot: number;
};

function subjectsForDay(subjects: string[], day: number, fridayPeriods: number): string[] {
  if (day === 5) return subjects.slice(0, Math.min(fridayPeriods, subjects.length));
  return subjects;
}

function mapKey(sectionId: string, subject: string) {
  return `${sectionId}::${subject.toLowerCase()}`;
}

/** Assign virtual T slots and map each (class, subject) → one slot for the week (R5). */
export function buildTeacherSlots(
  classes: ClassSubjectPlan[],
  mode: "subject_wise" | "mixed",
  targetCount: number,
  fridayPeriods: number,
  workingDays: number,
  periodsByDay: Record<number, number>
): { teacher_slots: VirtualTeacherSlot[]; class_subject_slot: Record<string, number> } {
  const class_subject_slot: Record<string, number> = {};
  const teacher_slots: VirtualTeacherSlot[] = [];

  if (mode === "subject_wise") {
    const allSubjects = Array.from(new Set(classes.flatMap((c) => c.subjects)));
    let next = 1;
    for (const sub of allSubjects) {
      let need = 1;
      for (let d = 1; d <= workingDays; d++) {
        const P = periodsByDay[d] || 1;
        let count = 0;
        for (const c of classes) {
          if (subjectsForDay(c.subjects, d, fridayPeriods).includes(sub)) count += 1;
        }
        need = Math.max(need, Math.ceil(count / P));
      }
      const slotNos: number[] = [];
      for (let i = 0; i < need; i++) {
        const n = next++;
        slotNos.push(n);
        teacher_slots.push({ slot_no: n, subject_name: sub, label: `T${n} · ${sub}` });
      }
      const classesWith = classes.filter((c) => c.subjects.includes(sub));
      classesWith.forEach((c, idx) => {
        class_subject_slot[mapKey(c.section_id, sub)] = slotNos[idx % slotNos.length];
      });
    }
    while (teacher_slots.length < targetCount) {
      const n = teacher_slots.length + 1;
      teacher_slots.push({ slot_no: n, subject_name: null, label: `T${n}` });
    }
    return { teacher_slots, class_subject_slot };
  }

  // mixed: create targetCount generic slots; balance (class,subject) load
  for (let i = 1; i <= targetCount; i++) {
    teacher_slots.push({ slot_no: i, subject_name: null, label: `T${i}` });
  }
  const load = Array(targetCount + 1).fill(0);
  const pairs: { section_id: string; subject: string }[] = [];
  for (const c of classes) {
    for (const sub of c.subjects) pairs.push({ section_id: c.section_id, subject: sub });
  }
  // Sort for stability
  pairs.sort((a, b) => a.subject.localeCompare(b.subject) || a.section_id.localeCompare(b.section_id));
  for (const p of pairs) {
    let best = 1;
    for (let s = 2; s <= targetCount; s++) {
      if (load[s] < load[best]) best = s;
    }
    class_subject_slot[mapKey(p.section_id, p.subject)] = best;
    load[best] += 1;
  }
  return { teacher_slots, class_subject_slot };
}

/**
 * Exact bipartite edge coloring via backtracking (school-sized graphs).
 * Guaranteed when class degree ≤ maxColors and teacher degree ≤ maxColors.
 */
export function colorEdges(edges: Edge[], maxColors: number): Map<string, number> | null {
  const classUsed = new Map<string, Set<number>>();
  const teacherUsed = new Map<number, Set<number>>();
  const colorOf = new Map<string, number>();

  const deg = new Map<string, number>();
  for (const e of edges) {
    deg.set(e.id, 0);
  }
  const classDeg = new Map<string, number>();
  const teacherDeg = new Map<number, number>();
  for (const e of edges) {
    classDeg.set(e.section_id, (classDeg.get(e.section_id) || 0) + 1);
    teacherDeg.set(e.teacher_slot, (teacherDeg.get(e.teacher_slot) || 0) + 1);
  }
  for (const [, d] of classDeg) if (d > maxColors) return null;
  for (const [, d] of teacherDeg) if (d > maxColors) return null;

  const ordered = [...edges].sort((a, b) => {
    const da = (classDeg.get(a.section_id) || 0) + (teacherDeg.get(a.teacher_slot) || 0);
    const db = (classDeg.get(b.section_id) || 0) + (teacherDeg.get(b.teacher_slot) || 0);
    return db - da;
  });

  function bt(i: number): boolean {
    if (i >= ordered.length) return true;
    const e = ordered[i];
    const cu = classUsed.get(e.section_id) || new Set();
    const tu = teacherUsed.get(e.teacher_slot) || new Set();
    for (let p = 1; p <= maxColors; p++) {
      if (cu.has(p) || tu.has(p)) continue;
      cu.add(p);
      tu.add(p);
      classUsed.set(e.section_id, cu);
      teacherUsed.set(e.teacher_slot, tu);
      colorOf.set(e.id, p);
      if (bt(i + 1)) return true;
      cu.delete(p);
      tu.delete(p);
      colorOf.delete(e.id);
    }
    return false;
  }

  return bt(0) ? colorOf : null;
}

function rotatePeriod(period: number, day: number, maxP: number, enabled: boolean): number {
  if (!enabled || maxP <= 1) return period;
  // Shift by (day-1) so subject moves across days
  return ((period - 1 + (day - 1)) % maxP) + 1;
}

/** Soft preference: Maths/English early, PT/Games late — swap if no clash. */
function softImprove(slots: GeneratedLesson[], periodsByDay: Record<number, number>): GeneratedLesson[] {
  const early = /math|english|urdu|science/i;
  const late = /pt|game|sport|islami|islamiyat/i;
  const out = slots.map((s) => ({ ...s }));
  const byDay = new Map<number, GeneratedLesson[]>();
  for (const s of out) {
    if (s.is_free) continue;
    const list = byDay.get(s.day_of_week) || [];
    list.push(s);
    byDay.set(s.day_of_week, list);
  }

  for (const [day, list] of byDay) {
    const P = periodsByDay[day] || 0;
    // Try swaps within same teacher or same class to move early subjects earlier
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.section_id !== b.section_id) continue;
        const aEarly = early.test(a.subject_name) && a.period_number > Math.ceil(P / 2);
        const bLate = late.test(b.subject_name) && b.period_number <= Math.ceil(P / 2);
        if (!(aEarly || bLate)) continue;
        // Swap periods if teachers don't clash
        const aPeriod = a.period_number;
        const bPeriod = b.period_number;
        const clashA = list.some(
          (x) => x !== a && x !== b && x.teacher_slot === a.teacher_slot && x.period_number === bPeriod
        );
        const clashB = list.some(
          (x) => x !== a && x !== b && x.teacher_slot === b.teacher_slot && x.period_number === aPeriod
        );
        if (clashA || clashB) continue;
        a.period_number = bPeriod;
        b.period_number = aPeriod;
      }
    }
  }
  return out;
}

export function generateTimetableV2(input: GeneratorInput): GenerateResult {
  const schedules = mergeDaySchedules(input.day_schedules);
  const classes = input.classes.filter((c) => c.subjects.length > 0);
  const workingDays = Math.min(6, Math.max(1, input.working_days || 6));

  const feat = minTeachersNeeded({ ...input, classes, day_schedules: schedules, working_days: workingDays });
  const errors = checkFeasibility({ ...input, classes, day_schedules: schedules, working_days: workingDays });
  if (errors.length) return { ok: false, errors };

  const maxSubjects = feat.maxSubjects;
  const { periods_by_day, period_minutes_by_day } = computeBell(schedules, maxSubjects, workingDays);
  const fridayPeriods = periods_by_day[5] || 0;

  const targetTeachers = input.teacher_count_auto !== false
    ? feat.min
    : Math.max(feat.min, Number(input.teacher_count) || feat.min);

  const { teacher_slots, class_subject_slot } = buildTeacherSlots(
    classes,
    input.teacher_slot_mode,
    targetTeachers,
    fridayPeriods,
    workingDays,
    periods_by_day
  );

  // Verify R5 mapping exists for all pairs
  for (const c of classes) {
    for (const sub of c.subjects) {
      if (!class_subject_slot[mapKey(c.section_id, sub)]) {
        return {
          ok: false,
          errors: [
            {
              code: "slot_map",
              message: `Could not assign a teacher slot for ${c.class_name || c.section_id} / ${sub}.`,
              fix: "Increase teacher slots (Auto).",
            },
          ],
        };
      }
    }
  }

  const rotation = input.rotation_enabled !== false;
  const lessons: GeneratedLesson[] = [];
  const maxBell = Math.max(...Object.values(periods_by_day), 1);

  for (let day = 1; day <= workingDays; day++) {
    const P = periods_by_day[day] || 0;
    if (P <= 0) {
      return {
        ok: false,
        errors: [
          {
            code: "no_periods",
            message: `Day ${day} has 0 periods from the schedule.`,
            fix: "Check start/end times and break for that day.",
          },
        ],
      };
    }

    const edges: Edge[] = [];
    for (const c of classes) {
      const daySubs = subjectsForDay(c.subjects, day, fridayPeriods);
      for (const sub of daySubs) {
        const ts = class_subject_slot[mapKey(c.section_id, sub)];
        edges.push({
          id: `${c.section_id}:${sub}:${day}`,
          section_id: c.section_id,
          subject_name: sub,
          teacher_slot: ts,
        });
      }
    }

    const colors = colorEdges(edges, P);
    if (!colors) {
      return {
        ok: false,
        errors: [
          {
            code: "coloring",
            message: `Could not place lessons on day ${day} without teacher/class clash (${edges.length} lessons, ${P} periods).`,
            fix: "Increase teachers or periods.",
          },
        ],
      };
    }

    // Room assignment per period
    const roomByPeriodClass = new Map<string, number>();
    for (const e of edges) {
      const rawPeriod = colors.get(e.id)!;
      const period = rotatePeriod(rawPeriod, day, P, rotation);
      // Assign room: class index stable
      const classIdx = classes.findIndex((c) => c.section_id === e.section_id);
      let room = (classIdx % input.num_rooms) + 1;
      const rk = `${day}:${period}:${room}`;
      // Ensure unique room per period
      const used = new Set<number>();
      for (const [k, r] of roomByPeriodClass) {
        if (k.startsWith(`${day}:${period}:`)) used.add(r);
      }
      if (used.has(room)) {
        room = 0;
        for (let r = 1; r <= input.num_rooms; r++) {
          if (!used.has(r)) {
            room = r;
            break;
          }
        }
      }
      if (!room) {
        return {
          ok: false,
          errors: [
            {
              code: "rooms_period",
              message: `Not enough rooms on day ${day} period ${period}.`,
              fix: `Increase rooms to at least ${classes.length}.`,
            },
          ],
        };
      }
      roomByPeriodClass.set(`${day}:${period}:${e.section_id}`, room);

      lessons.push({
        section_id: e.section_id,
        subject_name: e.subject_name,
        teacher_slot: e.teacher_slot,
        day_of_week: day,
        period_number: period,
        room_number: room,
        is_free: false,
      });
    }

    // Free periods for unused bell slots (early dismissal / Friday remainder)
    for (const c of classes) {
      const usedPeriods = new Set(
        lessons.filter((l) => l.section_id === c.section_id && l.day_of_week === day && !l.is_free).map((l) => l.period_number)
      );
      const classIdx = classes.findIndex((x) => x.section_id === c.section_id);
      for (let p = 1; p <= P; p++) {
        if (usedPeriods.has(p)) continue;
        lessons.push({
          section_id: c.section_id,
          subject_name: "Free",
          teacher_slot: 0,
          day_of_week: day,
          period_number: p,
          room_number: (classIdx % input.num_rooms) + 1,
          is_free: true,
        });
      }
    }
  }

  // R1 verify Mon-Thu+Sat: each subject exactly once
  for (const c of classes) {
    for (let day = 1; day <= workingDays; day++) {
      if (day === 5) continue;
      const placed = lessons.filter(
        (l) => l.section_id === c.section_id && l.day_of_week === day && !l.is_free
      );
      if (placed.length !== c.subjects.length) {
        return {
          ok: false,
          errors: [
            {
              code: "r1",
              message: `Hard rule R1 failed for ${c.class_name || c.section_id} on day ${day}.`,
              fix: "Check subjects and periods.",
            },
          ],
        };
      }
      const names = placed.map((p) => p.subject_name).sort();
      const expect = [...c.subjects].sort();
      if (names.join("|") !== expect.join("|")) {
        return {
          ok: false,
          errors: [
            {
              code: "r1_subjects",
              message: `Subject set mismatch on day ${day} for ${c.class_name || c.section_id}.`,
            },
          ],
        };
      }
    }
  }

  // Teacher clash check
  const seen = new Set<string>();
  for (const l of lessons) {
    if (l.is_free || !l.teacher_slot) continue;
    const k = `${l.day_of_week}:${l.period_number}:${l.teacher_slot}`;
    if (seen.has(k)) {
      return {
        ok: false,
        errors: [{ code: "clash", message: "Teacher clash detected after placement.", fix: "Increase teachers." }],
      };
    }
    seen.add(k);
  }

  const improved = softImprove(
    lessons.filter((l) => !l.is_free),
    periods_by_day
  );
  const frees = lessons.filter((l) => l.is_free);
  const finalSlots = [...improved, ...frees];

  return {
    ok: true,
    slots: finalSlots,
    teacher_slots,
    class_subject_slot,
    periods_by_day,
    period_minutes_by_day,
    min_teachers: feat.min,
  };
}

// Re-export for tests
export { subjectsForDay, mapKey };
