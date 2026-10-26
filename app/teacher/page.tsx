import Image from "next/image";
import Link from "next/link";
import { Shell } from "@/components/shell";
import { MonthSearch } from "@/components/month-search";
import { StatTiles } from "@/components/dashboard-charts";
import { AnnouncementDot } from "@/components/announcement-dot";
import { TimetableGrid } from "@/components/timetable-grid";
import { SCHOOL } from "@/lib/brand";
import { pkr } from "@/lib/format";
import { parsePeriod } from "@/lib/period";
import { getTeacherClasses } from "@/lib/teacher-classes";
import { getContext } from "@/lib/session";
import { mergeSettings } from "@/lib/timetable/defaults";
import { redirect } from "next/navigation";

type TeacherDash = {
  assignment_count: number;
  announcement_count: number;
  period_count: number;
};

const QUICK: {
  href: string;
  title: string;
  icon: "tt" | "classes" | "students" | "salary" | "announce" | "make_announce";
}[] = [
  { href: "/teacher/classes", title: "Assigned classes", icon: "classes" },
  { href: "/teacher/students", title: "Students roster", icon: "students" },
  { href: "/teacher/salary", title: "My salary", icon: "salary" },
  { href: "/teacher/timetable", title: "My timetable", icon: "tt" },
  { href: "/teacher/announcements", title: "Announcements", icon: "announce" },
  { href: "/teacher/announcements/make", title: "Make announcement", icon: "make_announce" },
];

function QuickIcon({ kind }: { kind: (typeof QUICK)[number]["icon"] }) {
  const c = "h-5 w-5";
  switch (kind) {
    case "tt":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
      );
    case "classes":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 19V5a1 1 0 0 1 1-1h6v15H5a1 1 0 0 1-1-1zM14 4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-5V4z" />
        </svg>
      );
    case "students":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
          <circle cx="17" cy="9" r="2.2" />
        </svg>
      );
    case "salary":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18M16 14.5h2" />
        </svg>
      );
    case "announce":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      );
    case "make_announce":
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
  }
}

export default async function TeacherHome({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp);
  const { supabase, profile, schoolId } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const thisMonth = period.month;
  const thisYear = period.year;
  const firstName = profile.name.split(" ")[0] || "Teacher";

  const [
    { data: dash, error: dashErr },
    { data: settingsRow },
    { data: ttSlots },
    classes,
    { data: salaryRow },
    { data: thisPay },
  ] = await Promise.all([
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

  const sectionIds = classes.map((c) => c.sectionId);
  const { count: studentCount } = sectionIds.length
    ? await supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("status", "active")
        .in("section_id", sectionIds)
    : { count: 0 };

  const settings = mergeSettings(settingsRow as any);
  const ttCells = (ttSlots || []).map((row: any) => ({
    day_of_week: row.day_of_week,
    period_number: row.period_number,
    subject_name: row.subjects?.name,
    section_label: row.sections?.classes?.name || "Class",
    room_number: row.room_number,
  }));

  const assignCount = d.assignment_count || classes.length;
  const announcements = d.announcement_count || 0;
  const monthlySalary = Number(salaryRow?.monthly_salary || 0);
  const salaryPaidThisMonth = !!thisPay;

  return (
    <Shell
      role="teacher"
      title="Dashboard"
      headingActions={
        <MonthSearch
          period={period}
          photoUrl={profile.photo_url}
          name={profile.name}
          basePath="/teacher"
          roleLabel="Teacher"
        />
      }
    >
      {/* Welcome banner */}
      <section className="relative overflow-hidden rounded-2xl bg-[#0b1f3a] shadow-[0_2px_14px_rgba(7,21,40,0.2)]">
        <div className="absolute inset-y-0 right-0 w-[48%] opacity-40 sm:opacity-50 md:w-[55%] md:opacity-60">
          <Image
            src={`${SCHOOL.campusSrc}?v=4`}
            alt=""
            fill
            priority
            className="object-cover object-[center_35%]"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1f3a] via-[#0b1f3a]/70 to-transparent" />
        </div>
        <div className="relative z-[1] flex min-h-[9rem] flex-col justify-center gap-3 p-4 sm:min-h-[10rem] sm:p-6 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="max-w-md">
            <h2 className="text-lg font-bold leading-snug text-white sm:text-2xl">
              Welcome back, {firstName}
            </h2>
            <p className="mt-1 text-xs text-sky-100/80 sm:text-sm">Let&apos;s make this week productive.</p>
          </div>
          <p
            className="max-w-sm text-xs italic leading-relaxed text-white/85 sm:text-sm md:text-right md:text-[15px]"
            style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
          >
            &ldquo;A good teacher can inspire hope, ignite imagination, and instil a love for learning.&rdquo;
          </p>
        </div>
      </section>

      {/* Modern Stat Tiles */}
      <div className="mt-4">
        <StatTiles
          items={[
            {
              label: "Assigned classes",
              value: classes.length,
              href: "/teacher/classes",
              tone: "sky",
              hint: "View subjects",
            },
            {
              label: "Enrolled students",
              value: studentCount ?? "—",
              href: "/teacher/students",
              tone: "emerald",
              hint: "Class roster",
            },
            {
              label: "Salary status",
              value: monthlySalary > 0 ? pkr(monthlySalary) : "Not set",
              href: "/teacher/salary",
              tone: "amber",
              hint: salaryPaidThisMonth ? "Paid this month" : "Unpaid this month",
              icon: "coins",
            },
            {
              label: "Announcements",
              value: announcements,
              href: "/teacher/announcements",
              tone: "rose",
              hint: "Notice board",
            },
          ]}
        />
      </div>

      {/* Action Links */}
      <section className="mt-5">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:gap-3 lg:grid-cols-3">
          {QUICK.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-xs transition hover:border-sky-300 hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f2fb] text-[#1a8cff] transition group-hover:scale-105">
                <QuickIcon kind={a.icon} />
              </span>
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <p className="truncate text-sm font-bold text-[#0b1f3a] transition group-hover:text-brand-accent">
                  {a.title}
                </p>
                {a.href === "/teacher/announcements" && <AnnouncementDot />}
              </div>
              <svg
                className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-accent"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      {/* Grid: Assigned Classes & Weekly Timetable */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🏫</span>
              <h2 className="text-sm font-bold text-[#0b1f3a]">Assigned classes</h2>
            </div>
            <Link href="/teacher/classes" className="text-xs font-bold text-[#1a8cff] hover:underline">
              View all &amp; subjects →
            </Link>
          </div>
          {classes.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {classes.map((c) => (
                <Link
                  key={c.sectionId}
                  href={`/teacher/classes?section_id=${c.sectionId}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs font-bold text-[#0b1f3a] transition hover:border-[#1a8cff] hover:bg-white hover:shadow-xs"
                >
                  <span>{c.label}</span>
                  {c.subjects.length > 0 && (
                    <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">
                      {c.subjects.length} subject{c.subjects.length > 1 ? "s" : ""}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-slate-400">No classes assigned yet.</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🗓️</span>
              <h2 className="text-sm font-bold text-[#0b1f3a]">Weekly timetable</h2>
            </div>
            <Link href="/teacher/timetable" className="text-xs font-bold text-[#1a8cff] hover:underline">
              Full schedule →
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
            <div className="flex h-40 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50/70 text-center text-xs text-slate-400">
              <svg className="h-7 w-7 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M3 9h18M8 3v4M16 3v4" />
              </svg>
              <p className="font-semibold text-slate-500">No timetable published yet.</p>
              <p className="text-[11px] text-slate-400">Your weekly schedule will appear here once published.</p>
            </div>
          )}
        </section>
      </div>
    </Shell>
  );
}
