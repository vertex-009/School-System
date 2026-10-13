import { AttendanceForm } from "@/components/attendance-form";
import { ClassChipBar } from "@/components/class-chip-bar";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";
import { getTeacherClasses } from "@/lib/teacher-classes";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TeacherAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ section_id?: string; date?: string }>;
}) {
  const { section_id, date } = await searchParams;
  const { supabase, profile, schoolId } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const day = date || new Date().toISOString().slice(0, 10);
  const classes = await getTeacherClasses(supabase, schoolId, profile.id);
  const sectionId = section_id && classes.some((c) => c.sectionId === section_id) ? section_id : classes[0]?.sectionId || "";
  const active = classes.find((c) => c.sectionId === sectionId);

  let students: { id: string; name: string; admission_no: string; roll_no?: number | null }[] = [];
  let existing: Record<string, string> = {};
  if (sectionId) {
    const [{ data: studs }, { data: rows }] = await Promise.all([
      supabase
        .from("students")
        .select("id, name, admission_no, roll_no")
        .eq("section_id", sectionId)
        .eq("school_id", schoolId)
        .eq("status", "active")
        .order("roll_no", { ascending: true, nullsFirst: false })
        .order("name"),
      supabase.from("attendance").select("student_id, status").eq("section_id", sectionId).eq("date", day),
    ]);
    students = studs || [];
    existing = Object.fromEntries((rows || []).map((r) => [r.student_id, r.status]));
  }

  const alreadyMarked = Object.keys(existing).length > 0;

  return (
    <Shell role="teacher" title="Mark attendance">
      <Card title="Class" subtitle="Pick a class from your timetable / assign">
        <ClassChipBar
          classes={classes}
          activeSectionId={sectionId}
          basePath="/teacher/attendance"
          extraQuery={`&date=${day}`}
        />
      </Card>

      {sectionId && (
        <Card title="Date" subtitle="Change date to view or edit a previous day">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="section_id" value={sectionId} />
            <label className="block text-xs font-bold text-slate-600">
              Attendance date
              <input
                type="date"
                name="date"
                defaultValue={day}
                className="mt-1.5 block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
              />
            </label>
            <button type="submit" className="rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-accent">
              Load
            </button>
            {alreadyMarked && (
              <span className="self-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                Existing record — you can edit & save
              </span>
            )}
          </form>
        </Card>
      )}

      {sectionId && students.length > 0 && (
        <Card title={`${active?.label || "Class"} · ${day}`} subtitle={`${students.length} students`}>
          <AttendanceForm
            key={`${sectionId}-${day}`}
            date={day}
            sectionId={sectionId}
            students={students}
            existing={existing}
          />
        </Card>
      )}

      {sectionId && !students.length && (
        <p className="text-sm text-slate-500">No active students in this class.</p>
      )}
    </Shell>
  );
}
