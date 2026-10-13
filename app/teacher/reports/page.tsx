import Link from "next/link";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";
import { getTeacherClasses } from "@/lib/teacher-classes";
import { getContext } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function TeacherReportsPage() {
  const { supabase, profile, schoolId } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const classes = await getTeacherClasses(supabase, schoolId, profile.id);

  const REPORTS = [
    { href: "/teacher/students", title: "Class roster", desc: "Students by your assigned / timetable classes" },
    { href: "/teacher/attendance", title: "Attendance sheet", desc: "Mark or edit attendance by date" },
    { href: "/teacher/marks", title: "Marks / results entry", desc: "First term & finals — obtained / total" },
    { href: "/teacher/timetable", title: "My timetable", desc: "Weekly period grid" },
    { href: "/teacher/classes", title: "Assigned classes", desc: "Quick links per class" },
    { href: "/teacher/announcements", title: "Announcements log", desc: "Received & sent notices" },
  ];

  return (
    <Shell role="teacher" title="Reports">
      <Card title="Generate / open reports" subtitle="Jump to the view you need — print from the browser when ready.">
        <div className="grid gap-3 sm:grid-cols-2">
          {REPORTS.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
            >
              <p className="font-bold text-brand-navy">{r.title}</p>
              <p className="mt-1 text-xs text-slate-500">{r.desc}</p>
            </Link>
          ))}
        </div>
      </Card>

      {classes.length > 0 && (
        <Card title="By class" subtitle="Open roster / attendance / marks for one class">
          <ul className="grid gap-2 sm:grid-cols-2">
            {classes.map((c) => (
              <li key={c.sectionId} className="rounded-xl border border-slate-100 px-4 py-3 text-sm">
                <p className="font-bold text-brand-navy">{c.label}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold">
                  <Link href={`/teacher/students?section_id=${c.sectionId}`} className="text-brand-accent hover:underline">
                    Roster
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
        </Card>
      )}
    </Shell>
  );
}
