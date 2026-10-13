import Link from "next/link";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";
import { getTeacherClasses } from "@/lib/teacher-classes";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TeacherClassesPage() {
  const { supabase, profile, schoolId } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const classes = await getTeacherClasses(supabase, schoolId, profile.id);

  return (
    <Shell role="teacher" title="Assigned classes">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">Classes from Principal assign and your published timetable.</p>
        <Link href="/teacher/timetable" className="text-xs font-bold text-brand-accent hover:underline">
          My timetable →
        </Link>
      </div>

      <Card title="Classes" subtitle={`${classes.length} class(es)`}>
        {!classes.length ? (
          <p className="text-sm text-slate-500">Nothing assigned yet.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {classes.map((c) => (
              <li key={c.sectionId} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-base font-bold text-brand-navy">{c.label}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {c.subjects.length ? c.subjects.join(" · ") : "Subjects via timetable / assign"}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold">
                  <Link href={`/teacher/students?section_id=${c.sectionId}`} className="text-brand-accent hover:underline">
                    Students
                  </Link>
                  <Link href={`/teacher/attendance?section_id=${c.sectionId}`} className="text-brand-accent hover:underline">
                    Attendance
                  </Link>
                  <Link href={`/teacher/marks?section_id=${c.sectionId}`} className="text-brand-accent hover:underline">
                    Marks
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Shell>
  );
}
