import { Shell } from "@/components/shell";
import { getTeacherClasses } from "@/lib/teacher-classes";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";
import { AssignedClassesClient, type TeacherClassItem } from "./assigned-classes-client";

export default async function TeacherClassesPage({
  searchParams,
}: {
  searchParams?: Promise<{ section_id?: string }>;
}) {
  const { supabase, profile, schoolId } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const sp = searchParams ? await searchParams : undefined;

  const [classesData, { data: studentsData }] = await Promise.all([
    getTeacherClasses(supabase, schoolId, profile.id),
    supabase
      .from("students")
      .select("id, name, roll_no, admission_no, father_name, section_id")
      .eq("school_id", schoolId)
      .eq("status", "active")
      .order("roll_no", { ascending: true }),
  ]);

  const studentsBySection: Record<string, { id: string; name: string; roll_no: string | null; admission_no: string | null; father_name: string | null }[]> = {};
  for (const s of studentsData || []) {
    if (!studentsBySection[s.section_id]) studentsBySection[s.section_id] = [];
    studentsBySection[s.section_id].push({
      id: s.id,
      name: s.name,
      roll_no: s.roll_no,
      admission_no: s.admission_no,
      father_name: s.father_name,
    });
  }

  const mappedClasses: TeacherClassItem[] = (classesData || []).map((c) => {
    const list = studentsBySection[c.sectionId] || [];
    return {
      sectionId: c.sectionId,
      classId: c.classId,
      label: c.label,
      subjects: c.subjects,
      studentCount: list.length,
      students: list,
    };
  });

  return (
    <Shell role="teacher" title="Assigned classes">
      <AssignedClassesClient classes={mappedClasses} initialSectionId={sp?.section_id} />
    </Shell>
  );
}
