import { describe, expect, it } from "vitest";
import { checkFeasibility, minTeachersNeeded } from "./feasibility";
import { generateTimetableV2 } from "./generate-v2";
import { DEFAULT_DAY_SCHEDULES } from "./schedule";
import type { ClassSubjectPlan, GeneratorInput } from "./types";

const SUBJECTS_10 = [
  "Maths",
  "English",
  "Urdu",
  "Science",
  "Islamiyat",
  "SST",
  "Computer",
  "PT",
  "Art",
  "Drawing",
];
const SUBJECTS_8 = SUBJECTS_10.slice(0, 8);

function makeClasses(): ClassSubjectPlan[] {
  const out: ClassSubjectPlan[] = [];
  for (let i = 1; i <= 10; i++) {
    out.push({
      section_id: `sec-${i}`,
      class_id: `cls-${i}`,
      class_name: `Class ${i}`,
      subjects: i <= 5 ? [...SUBJECTS_10] : [...SUBJECTS_8],
    });
  }
  return out;
}

function baseInput(over: Partial<GeneratorInput> = {}): GeneratorInput {
  return {
    classes: makeClasses(),
    day_schedules: DEFAULT_DAY_SCHEDULES,
    working_days: 6,
    num_rooms: 10,
    teacher_slot_mode: "subject_wise",
    teacher_count_auto: true,
    rotation_enabled: true,
    ...over,
  };
}

describe("generateTimetableV2", () => {
  it("10 classes, 8/10 subjects: R1 Mon–Thu+Sat, Friday first 4, no teacher clash", () => {
    const result = generateTimetableV2(baseInput({ teacher_slot_mode: "subject_wise" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.periods_by_day[1]).toBe(10);
    expect(result.periods_by_day[5]).toBeGreaterThanOrEqual(4);

    for (const c of makeClasses()) {
      for (const day of [1, 2, 3, 4, 6]) {
        const lessons = result.slots.filter(
          (s) => s.section_id === c.section_id && s.day_of_week === day && !s.is_free
        );
        expect(lessons.length).toBe(c.subjects.length);
        expect(new Set(lessons.map((l) => l.subject_name)).size).toBe(c.subjects.length);
      }
      const fri = result.slots.filter(
        (s) => s.section_id === c.section_id && s.day_of_week === 5 && !s.is_free
      );
      const n = Math.min(result.periods_by_day[5], c.subjects.length);
      expect(fri.length).toBe(n);
      expect(fri.map((f) => f.subject_name)).toEqual(c.subjects.slice(0, n));
    }

    const seen = new Set<string>();
    for (const s of result.slots) {
      if (s.is_free || !s.teacher_slot) continue;
      const k = `${s.day_of_week}:${s.period_number}:${s.teacher_slot}`;
      expect(seen.has(k)).toBe(false);
      seen.add(k);
    }
  });

  it("works in mixed mode too", () => {
    const result = generateTimetableV2(baseInput({ teacher_slot_mode: "mixed" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.min_teachers).toBeGreaterThan(0);
    expect(result.slots.some((s) => !s.is_free)).toBe(true);
  });

  it("fails when rooms < classes", () => {
    const result = generateTimetableV2(baseInput({ num_rooms: 3 }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.code === "rooms")).toBe(true);
  });

  it("fails when teacher count too low", () => {
    const feat = minTeachersNeeded(baseInput());
    const result = generateTimetableV2(
      baseInput({ teacher_count_auto: false, teacher_count: Math.max(1, feat.min - 1) })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.code === "teachers")).toBe(true);
  });

  it("fails when subjects cannot fit in the school day", () => {
    const shortDay = {
      start: "08:00",
      end: "08:08",
      break_after: 0,
      break_minutes: 0,
    };
    const schedules = {
      "1": shortDay,
      "2": shortDay,
      "3": shortDay,
      "4": shortDay,
      "5": shortDay,
      "6": shortDay,
    };
    const errs = checkFeasibility(baseInput({ day_schedules: schedules }));
    expect(errs.some((e) => e.code === "subjects_gt_periods" || e.code === "bell")).toBe(true);
  });
});
