export type TeacherSlotMode = "subject_wise" | "mixed";

export type DaySchedule = {
  start: string; // HH:MM
  end: string;
  break_after: number;
  break_minutes: number;
};

/** day_of_week 1=Mon .. 6=Sat */
export type DaySchedules = Record<string, DaySchedule>;

export type ClassSubjectPlan = {
  section_id: string;
  class_id?: string;
  class_name?: string;
  /** Ordered subject names (Friday uses first N) */
  subjects: string[];
};

export type GeneratorInput = {
  classes: ClassSubjectPlan[];
  day_schedules: DaySchedules;
  working_days: number; // typically 6
  num_rooms: number;
  special_rooms?: { name: string; capacity: number }[];
  teacher_slot_mode: TeacherSlotMode;
  /** If set and not auto, must be >= computed minimum */
  teacher_count?: number | null;
  teacher_count_auto?: boolean;
  rotation_enabled?: boolean;
};

export type VirtualTeacherSlot = {
  slot_no: number;
  subject_name: string | null; // null in mixed when multi-subject
  label: string;
};

export type GeneratedLesson = {
  section_id: string;
  subject_name: string;
  teacher_slot: number;
  day_of_week: number;
  period_number: number;
  room_number: number;
  is_free: boolean;
};

export type FeasibilityError = {
  code: string;
  message: string;
  fix?: string;
};

export type GenerateOk = {
  ok: true;
  slots: GeneratedLesson[];
  teacher_slots: VirtualTeacherSlot[];
  /** (section_id, subject_name) -> teacher_slot */
  class_subject_slot: Record<string, number>;
  periods_by_day: Record<number, number>;
  period_minutes_by_day: Record<number, number>;
  min_teachers: number;
};

export type GenerateFail = {
  ok: false;
  errors: FeasibilityError[];
};

export type GenerateResult = GenerateOk | GenerateFail;
