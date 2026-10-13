import Link from "next/link";
import { Shell } from "@/components/shell";
import { BarChartCard, DashIntro, StatTiles } from "@/components/dashboard-charts";
import { TimetableGrid } from "@/components/timetable-grid";
import { SCHOOL } from "@/lib/brand";
import { MONTHS, pkr } from "@/lib/format";
import { getTeacherClasses } from "@/lib/teacher-classes";
import { getContext } from "@/lib/session";
import { mergeSettings } from "@/lib/timetable/defaults";
import { redirect } from "next/navigation";

type TeacherDash = {
  assignment_count: number;
  announcement_count: number;
  period_count: number;
};

export default async function TeacherHome() {
  const { supabase, profile, schoolId } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();

  const [{ data: dash, error: dashErr }, { data: settingsRow }, { data: ttSlots }, classes, { data: salaryRow }, { data: thisPay }] =
    await Promise.all([
      supabase.rpc("get_teacher_dashboard"),
      supabase.from("timetable_settings").select("*").eq("school_id", schoolId).maybeSingle(),
      supabase
        .from("timetable_slots")
        .select("day_of_week, period_number, room_number, subjects(name), sections(name, classes(name))")
        .eq("school_id", schoolId)
        .eq("teacher_id", profile.id)
        .order("day_of_week")
        .order("period_number"),
      getTeacherClasses(supabase, schoolId, profile.id),
      supabase
        .from("teacher_salaries")
        .select("monthly_salary")
        .eq("school_id", schoolId)
        .eq("teacher_id", profile.id)
        .maybeSingle(),
      supabase
        .from("salary_payments")
        .select("id")
        .eq("school_id", schoolId)
        .eq("teacher_id", profile.id)
        .eq("month", thisMonth)
        .eq("year", thisYear)
        .maybeSingle(),
    ]);
  if (dashErr) {
    throw new Error(`${dashErr.message} — If function missing, run supabase/migration_dashboard_perf.sql`);
  }
  const d = dash as TeacherDash;

  const settings = mergeSettings(settingsRow as any);
  const ttCells = (ttSlots || []).map((row: any) => ({
    day_of_week: row.day_of_week,
    period_number: row.period_number,
    subject_name: row.subjects?.name,
    section_label: row.sections?.classes?.name || "Class",
    room_number: row.room_number,
  }));

  const assignCount = d.assignment_count || classes.length;
  const periodCount = d.period_count || ttCells.length;
  const announcements = d.announcement_count || 0;
  const monthlySalary = Number(salaryRow?.monthly_salary || 0);
  const salaryPaidThisMonth = !!thisPay;

  const quick = [
    { href: "/teacher/timetable", title: "My timetable", desc: "Weekly schedule & rooms" },
    { href: "/teacher/classes", title: "Assigned classes", desc: "Subjects Principal gave you" },
    { href: "/teacher/students", title: "Students", desc: "Class-wise roster" },
    { href: "/teacher/attendance", title: "Attendance", desc: "Mark or edit today’s roll" },
    { href: "/teacher/marks", title: "Enter marks", desc: "Terms & finals" },
    { href: "/teacher/salary", title: "My salary", desc: "Paid / remaining by month" },
    { href: "/teacher/announcements/make", title: "Announce", desc: "Message Principal / Finance" },
    { href: "/teacher/reports", title: "Reports", desc: "Generate class reports" },
  ];

  return (
    <Shell role="teacher" title="Dashboard">
      <DashIntro title={`${SCHOOL.name} · Teacher`} detail={`Hi ${profile.name.split(" ")[0] || "Teacher"}`} />

      <StatTiles
        items={[
          { label: "Classes", value: classes.length || assignCount, href: "/teacher/classes", tone: "navy", hint: "Assigned + timetable" },
          { label: "Periods / week", value: periodCount, href: "/teacher/timetable", tone: "sky" },
          { label: "Announcements", value: announcements, href: "/teacher/announcements", tone: "amber" },
          { label: "Attendance", value: "Mark →", href: "/teacher/attendance", tone: "emerald" },
        ]}
      />

      <Link
        href="/teacher/salary"
        className={`mt-4 block rounded-2xl border px-5 py-4 transition hover:shadow-sm ${
          salaryPaidThisMonth
            ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
            : "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              My salary · {MONTHS[thisMonth - 1]} {thisYear}
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-brand-navy">
              {monthlySalary > 0 ? pkr(monthlySalary) : "Not set"}
              <span className="ml-2 text-sm font-bold text-slate-500">/ month</span>
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-block rounded-full px-4 py-1.5 text-xs font-black text-white ${
                salaryPaidThisMonth ? "bg-emerald-600" : "bg-amber-600"
              }`}
            >
              {salaryPaidThisMonth ? "Paid" : "Remaining"}
            </span>
            <p className="mt-2 text-[11px] font-bold text-brand-accent">Open salary →</p>
          </div>
        </div>
      </Link>

      <section className="mt-4">
        <h2 className="mb-3 text-sm font-bold text-brand-navy">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quick.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-sky hover:shadow-sm"
            >
              <p className="text-sm font-bold text-brand-navy">{a.title}</p>
              <p className="mt-1 text-xs text-slate-500">{a.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {classes.length > 0 && (
        <section className="mt-4 rounded-xl border border-slate-200/80 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-brand-navy">Your classes</h2>
            <Link href="/teacher/students" className="text-xs font-bold text-brand-accent hover:underline">
              Open roster →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => (
              <Link
                key={c.sectionId}
                href={`/teacher/students?section_id=${c.sectionId}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-brand-navy hover:border-brand-sky hover:bg-white"
              >
                {c.label}
                {c.subjects.length > 0 && (
                  <span className="ml-2 text-[10px] font-semibold text-slate-400">{c.subjects.slice(0, 2).join(", ")}</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <BarChartCard
          title="Workload"
          items={[
            { label: "Classes", value: classes.length || assignCount, color: "#0b1f3a" },
            { label: "Weekly periods", value: periodCount, color: "#5dade2" },
            { label: "Announcements", value: announcements, color: "#d97706" },
          ]}
        />
        <div className="rounded-xl border border-slate-200/80 bg-white p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-brand-navy">This week</h2>
            <Link href="/teacher/timetable" className="text-xs font-bold text-brand-accent hover:underline">
              Full timetable →
            </Link>
          </div>
          {ttCells.length ? (
            <TimetableGrid
              workingDays={settings.working_days}
              periodsPerDay={settings.periods_per_day}
              dayStart={settings.day_start}
              periodMinutes={settings.period_minutes}
              breakAfterPeriod={settings.break_after_period}
              breakMinutes={settings.break_minutes}
              cells={ttCells}
            />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
              No timetable published yet
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
