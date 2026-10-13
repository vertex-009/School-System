import type { SupabaseClient } from "@supabase/supabase-js";

export type TeacherSubject = { id: string; name: string };

export type TeacherClass = {
  sectionId: string;
  classId: string;
  label: string;
  subjects: string[];
  subjectEntries: TeacherSubject[];
};

/** Classes from principal assignments ∪ timetable slots for this teacher. */
export async function getTeacherClasses(
  supabase: SupabaseClient,
  schoolId: string,
  teacherId: string
): Promise<TeacherClass[]> {
  const [{ data: assignments }, { data: slots }] = await Promise.all([
    supabase
      .from("teacher_assignments")
      .select("section_id, subject_id, sections(id, name, class_id, classes(id, name, sort_order)), subjects(id, name)")
      .eq("teacher_id", teacherId)
      .eq("school_id", schoolId),
    supabase
      .from("timetable_slots")
      .select("section_id, subject_id, subjects(id, name), sections(id, name, class_id, classes(id, name, sort_order))")
      .eq("teacher_id", teacherId)
      .eq("school_id", schoolId),
  ]);

  const map = new Map<string, TeacherClass>();

  const add = (section: any, subjectId?: string | null, subjectName?: string | null) => {
    if (!section?.id) return;
    const className = section.classes?.name || "Class";
    let existing = map.get(section.id);
    if (!existing) {
      existing = {
        sectionId: section.id,
        classId: section.class_id || section.classes?.id || "",
        label: className,
        subjects: [],
        subjectEntries: [],
      };
      map.set(section.id, existing);
    }
    if (subjectName && !existing.subjects.includes(subjectName)) existing.subjects.push(subjectName);
    if (subjectId && subjectName && !existing.subjectEntries.some((s) => s.id === subjectId)) {
      existing.subjectEntries.push({ id: subjectId, name: subjectName });
    }
  };

  for (const a of assignments || []) {
    const sub = a.subjects as { id?: string; name?: string } | null;
    add(a.sections as any, a.subject_id || sub?.id, sub?.name);
  }
  for (const s of slots || []) {
    const sub = s.subjects as { id?: string; name?: string } | null;
    add(s.sections as any, (s as { subject_id?: string }).subject_id || sub?.id, sub?.name);
  }

  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
}
