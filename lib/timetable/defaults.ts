export const DEFAULT_TIMETABLE_SETTINGS = {
  day_start: "08:00",
  day_end: "14:00",
  period_minutes: 40,
  break_after_period: 4,
  break_minutes: 15,
  working_days: 6,
  periods_per_day: 7,
  num_rooms: 8,
  max_teacher_periods_per_day: 6,
  periods_per_subject_week: 4,
} as const;

export type TimetableSettingsRow = {
  day_start: string;
  day_end: string;
  period_minutes: number;
  break_after_period: number;
  break_minutes: number;
  working_days: number;
  periods_per_day: number;
  num_rooms: number;
  max_teacher_periods_per_day: number;
  periods_per_subject_week: number;
  generated_at?: string | null;
};

export function normalizeTime(t: string | null | undefined): string {
  if (!t) return "08:00";
  return t.slice(0, 5);
}

export function mergeSettings(row: TimetableSettingsRow | null): TimetableSettingsRow {
  if (!row) return { ...DEFAULT_TIMETABLE_SETTINGS };
  return {
    ...DEFAULT_TIMETABLE_SETTINGS,
    ...row,
    day_start: normalizeTime(row.day_start),
    day_end: normalizeTime(row.day_end),
  };
}
