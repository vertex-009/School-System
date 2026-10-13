import type { DaySchedule, DaySchedules } from "@/lib/timetable/types";
import { DAY_NAMES } from "@/lib/timetable/time";

export const DEFAULT_DAY_SCHEDULES: DaySchedules = {
  "1": { start: "08:00", end: "14:00", break_after: 4, break_minutes: 20 },
  "2": { start: "08:00", end: "14:00", break_after: 4, break_minutes: 20 },
  "3": { start: "08:00", end: "14:00", break_after: 4, break_minutes: 20 },
  "4": { start: "08:00", end: "14:00", break_after: 4, break_minutes: 20 },
  "5": { start: "08:00", end: "11:00", break_after: 2, break_minutes: 20 },
  "6": { start: "08:00", end: "14:00", break_after: 4, break_minutes: 20 },
};

export function mergeDaySchedules(raw: DaySchedules | null | undefined): DaySchedules {
  const out: DaySchedules = { ...DEFAULT_DAY_SCHEDULES };
  if (!raw || typeof raw !== "object") return out;
  for (let d = 1; d <= 6; d++) {
    const key = String(d);
    const row = raw[key];
    if (row && row.start && row.end) {
      out[key] = {
        start: String(row.start).slice(0, 5),
        end: String(row.end).slice(0, 5),
        break_after: Number(row.break_after) || 0,
        break_minutes: Number(row.break_minutes) || 0,
      };
    }
  }
  return out;
}

export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

/** Usable teaching minutes = span - break */
export function teachingMinutes(day: DaySchedule): number {
  return Math.max(0, minutesBetween(day.start, day.end) - (day.break_minutes || 0));
}

/**
 * Bell periods for a day given period duration (minutes).
 * periods = floor(teachingMinutes / periodMinutes)
 */
export function periodsForDay(day: DaySchedule, periodMinutes: number): number {
  if (periodMinutes <= 0) return 0;
  return Math.floor(teachingMinutes(day) / periodMinutes);
}

/**
 * School bell: period duration from the day with max subjects (R2).
 * periodMinutes = teachingMinutes(that day type) / maxSubjects
 * For Mon-Thu/Sat use same max; Friday uses floor(friTeaching / periodMinutes).
 */
export function computeBell(
  daySchedules: DaySchedules,
  maxSubjects: number,
  workingDays = 6
): {
  period_minutes: number;
  periods_by_day: Record<number, number>;
  period_minutes_by_day: Record<number, number>;
} {
  const maxSub = Math.max(1, maxSubjects);
  // Use Monday (or first non-Friday) as reference for duration
  const ref = daySchedules["1"] || DEFAULT_DAY_SCHEDULES["1"];
  const period_minutes = Math.max(1, Math.floor(teachingMinutes(ref) / maxSub));

  const periods_by_day: Record<number, number> = {};
  const period_minutes_by_day: Record<number, number> = {};
  for (let d = 1; d <= workingDays; d++) {
    const sch = daySchedules[String(d)] || ref;
    const periods = periodsForDay(sch, period_minutes);
    periods_by_day[d] = periods;
    period_minutes_by_day[d] = period_minutes;
  }
  return { period_minutes, periods_by_day, period_minutes_by_day };
}

export function periodWindow(
  day: DaySchedule,
  period: number,
  periodMinutes: number
): { start: string; end: string } {
  const [h0, m0] = day.start.split(":").map(Number);
  let offset = (period - 1) * periodMinutes;
  if (day.break_after > 0 && period > day.break_after) offset += day.break_minutes;
  const startM = h0 * 60 + m0 + offset;
  const endM = startM + periodMinutes;
  const fmt = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };
  return { start: fmt(startM), end: fmt(endM) };
}

export function dayLabel(day: number): string {
  return DAY_NAMES[day - 1] || `Day ${day}`;
}
