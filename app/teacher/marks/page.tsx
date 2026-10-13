import { ClassChipBar } from "@/components/class-chip-bar";
import { MarksForm } from "@/components/marks-form";
import { Shell } from "@/components/shell";
import { Card, Select } from "@/components/ui";
import { getTeacherClasses } from "@/lib/teacher-classes";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

function examKindLabel(kind: string) {
  if (kind === "final") return "Finals";
  if (kind === "test") return "First term / Test";
  return kind;
}

export default async function TeacherMarksPage({
  searchParams,
}: {
  searchParams: Promise<{ exam_id?: string; subject_id?: string; section_id?: string; kind?: string }>;
}) {
  const sp = await searchParams;
  const { supabase, profile, schoolId } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const classes = await getTeacherClasses(supabase, schoolId, profile.id);
  const sectionId = sp.section_id && classes.some((c) => c.sectionId === sp.section_id) ? sp.section_id : classes[0]?.sectionId || "";
  const active = classes.find((c) => c.sectionId === sectionId);
  const subjects = active?.subjectEntries || [];
  const subjectId = sp.subject_id && subjects.some((s) => s.id === sp.subject_id) ? sp.subject_id : subjects[0]?.id || "";

  const kindFilter = sp.kind === "final" || sp.kind === "test" ? sp.kind : "";

  let exams: { id: string; name: string; kind: string }[] = [];
  if (active?.classId) {
    let q = supabase.from("exams").select("id, name, kind").eq("class_id", active.classId).order("exam_date", { ascending: false });
    if (kindFilter) q = q.eq("kind", kindFilter);
    const { data } = await q;
    exams = data || [];
  }
  const examId = sp.exam_id && exams.some((e) => e.id === sp.exam_id) ? sp.exam_id : exams[0]?.id || "";
  const activeExam = exams.find((e) => e.id === examId);

  let students: { id: string; name: string; roll_no?: number | null; admission_no?: string }[] = [];
  let existing: Record<string, { obtained: number; total: number }> = {};
  if (sectionId && examId && subjectId) {
    const [{ data: studs }, { data: marks }] = await Promise.all([
      supabase
        .from("students")
        .select("id, name, roll_no, admission_no")
        .eq("section_id", sectionId)
        .eq("school_id", schoolId)
        .eq("status", "active")
        .order("roll_no", { ascending: true, nullsFirst: false })
        .order("name"),
      supabase.from("marks").select("student_id, obtained, total").eq("exam_id", examId).eq("subject_id", subjectId),
    ]);
    students = studs || [];
    existing = Object.fromEntries((marks || []).map((m) => [m.student_id, { obtained: Number(m.obtained), total: Number(m.total) }]));
  }

  const extra = [
    subjectId ? `&subject_id=${subjectId}` : "",
    examId ? `&exam_id=${examId}` : "",
    kindFilter ? `&kind=${kindFilter}` : "",
  ].join("");

  return (
    <Shell role="teacher" title="Enter marks">
      <Card title="Class" subtitle="Pick a class from your timetable / assign">
        <ClassChipBar classes={classes} activeSectionId={sectionId} basePath="/teacher/marks" extraQuery={extra} />
      </Card>

      {sectionId && (
        <Card title="Exam & subject" subtitle="First term / finals · total & obtained marks">
          <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input type="hidden" name="section_id" value={sectionId} />
            <Select label="Term type" name="kind" defaultValue={kindFilter}>
              <option value="">All exams</option>
              <option value="test">First term / Test</option>
              <option value="final">Finals</option>
            </Select>
            <Select label="Exam" name="exam_id" defaultValue={examId}>
              {!exams.length && <option value="">No exams for this class</option>}
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({examKindLabel(e.kind)})
                </option>
              ))}
            </Select>
            <Select label="Subject" name="subject_id" defaultValue={subjectId}>
              {!subjects.length && <option value="">No subjects assigned</option>}
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <div className="self-end">
              <button type="submit" className="w-full rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent">
                Load
              </button>
            </div>
          </form>
        </Card>
      )}

      {examId && subjectId && students.length > 0 && (
        <Card
          title={`${active?.label || "Class"} · ${activeExam?.name || "Exam"}`}
          subtitle={`${examKindLabel(activeExam?.kind || "")} · ${subjects.find((s) => s.id === subjectId)?.name || "Subject"} · ${students.length} students`}
        >
          <MarksForm
            key={`${examId}-${subjectId}-${students.length}`}
            examId={examId}
            subjectId={subjectId}
            students={students}
            existing={existing}
          />
        </Card>
      )}

      {sectionId && examId && subjectId && !students.length && (
        <p className="text-sm text-slate-500">No active students in this class.</p>
      )}
    </Shell>
  );
}
