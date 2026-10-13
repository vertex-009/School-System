import { computeBell, dayLabel, mergeDaySchedules, teachingMinutes } from "@/lib/timetable/schedule";
import type { FeasibilityError, GeneratorInput } from "@/lib/timetable/types";

function subjectsForDay(subjects: string[], day: number, fridayPeriods: number): string[] {
  if (day === 5) {
    const n = Math.min(fridayPeriods, subjects.length);
    return subjects.slice(0, n);
  }
  return subjects;
}

export function minTeachersNeeded(input: GeneratorInput): {
  min: number;
  periods_by_day: Record<number, number>;
  maxSubjects: number;
  errors: FeasibilityError[];
} {
  const errors: FeasibilityError[] = [];
  const schedules = mergeDaySchedules(input.day_schedules);
  const classes = input.classes.filter((c) => c.subjects.length > 0);
  if (!classes.length) {
    return {
      min: 0,
      periods_by_day: {},
      maxSubjects: 0,
      errors: [{ code: "no_classes", message: "Add at least one class with subjects.", fix: "Set subjects per class." }],
    };
  }

  const maxSubjects = Math.max(...classes.map((c) => c.subjects.length));
  const { periods_by_day } = computeBell(schedules, maxSubjects, input.working_days);
  const fridayPeriods = periods_by_day[5] || 0;

  if (input.num_rooms < classes.length) {
    errors.push({
      code: "rooms",
      message: `Rooms (${input.num_rooms}) < classes (${classes.length}). Every class needs a room each period.`,
      fix: `Increase rooms to at least ${classes.length}.`,
    });
  }

  const ref = schedules["1"];
  if (ref && maxSubjects > 0) {
    const teach = teachingMinutes(ref);
    if (teach < maxSubjects) {
      errors.push({
        code: "subjects_gt_periods",
        message: `Max subjects (${maxSubjects}) need more teaching minutes than the day allows (${teach} min after break).`,
        fix: "Reduce subjects, lengthen the school day, or shorten break.",
      });
    }
  }

  for (const c of classes) {
    for (let d = 1; d <= input.working_days; d++) {
      if (d === 5) continue;
      const need = c.subjects.length;
      const have = periods_by_day[d] || 0;
      if (need > have) {
        errors.push({
          code: "subjects_gt_periods",
          message: `${c.class_name || c.section_id}: ${need} subjects but ${dayLabel(d)} has only ${have} periods.`,
          fix: "Reduce subjects, lengthen the school day, or shorten break so more periods fit.",
        });
        break;
      }
    }
  }

  let minTeachers = 1;
  if (input.teacher_slot_mode === "subject_wise") {
    // Per subject: max over days of ceil(classes_with_subject_that_day / periods_that_day)
    const allSubjects = new Set(classes.flatMap((c) => c.subjects));
    let sum = 0;
    for (const sub of allSubjects) {
      let need = 0;
      for (let d = 1; d <= input.working_days; d++) {
        const P = periods_by_day[d] || 0;
        if (P <= 0) continue;
        let count = 0;
        for (const c of classes) {
          const daySubs = subjectsForDay(c.subjects, d, fridayPeriods);
          if (daySubs.includes(sub)) count += 1;
        }
        need = Math.max(need, Math.ceil(count / P));
      }
      sum += Math.max(1, need);
    }
    minTeachers = sum;
  } else {
    // mixed: max over days ceil(total lessons / periods)
    let need = 0;
    for (let d = 1; d <= input.working_days; d++) {
      const P = periods_by_day[d] || 0;
      if (P <= 0) continue;
      let lessons = 0;
      for (const c of classes) {
        lessons += subjectsForDay(c.subjects, d, fridayPeriods).length;
      }
      need = Math.max(need, Math.ceil(lessons / P));
    }
    minTeachers = Math.max(1, need);
  }

  if (!input.teacher_count_auto && input.teacher_count != null && input.teacher_count < minTeachers) {
    errors.push({
      code: "teachers",
      message: `Teacher slots (${input.teacher_count}) are fewer than required (${minTeachers}) for ${input.teacher_slot_mode} mode.`,
      fix: `Set teachers to at least ${minTeachers}, or enable Auto.`,
    });
  }

  if ((periods_by_day[1] || 0) < maxSubjects) {
    errors.push({
      code: "bell",
      message: `Bell periods (${periods_by_day[1]}) < max subjects (${maxSubjects}).`,
      fix: "Lengthen Mon–Thu day or reduce break so every subject fits once per day.",
    });
  }

  return { min: minTeachers, periods_by_day, maxSubjects, errors };
}

export function checkFeasibility(input: GeneratorInput): FeasibilityError[] {
  return minTeachersNeeded(input).errors;
}
