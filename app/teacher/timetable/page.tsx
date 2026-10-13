import Link from "next/link";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";
import { TimetableGrid } from "@/components/timetable-grid";
import { getContext } from "@/lib/session";
import { mergeSettings } from "@/lib/timetable/defaults";
import { redirect } from "next/navigation";

export default async function TeacherTimetablePage() {
  const { supabase, profile, schoolId } = await getContext();
  if (profile.role !== "teacher" || !schoolId) redirect("/");

  const [{ data: settingsRow }, { data: slots }] = await Promise.all([
    supabase.from("timetable_settings").select("*").eq("school_id", schoolId).maybeSingle(),
    supabase
      .from("timetable_slots")
      .select("day_of_week, period_number, room_number, subjects(name), sections(name, classes(name))")
      .eq("school_id", schoolId)
      .eq("teacher_id", profile.id)
      .eq("plan_status", "published")
      .order("day_of_week")
      .order("period_number"),
  ]);

  const settings = mergeSettings(settingsRow as any);
  const cells = (slots || []).map((row: any) => ({
    day_of_week: row.day_of_week,
    period_number: row.period_number,
    subject_name: row.subjects?.name,
    section_label: `${row.sections?.classes?.name || ""}-${row.sections?.name || ""}`,
    room_number: row.room_number,
  }));

  return (
    <Shell role="teacher" title="My timetable">
      {!cells.length ? (
        <Card title="No timetable yet">
          <p className="text-sm text-slate-600">
            Your weekly schedule appears here after the Principal publishes the timetable and assigns you to teacher slots.
          </p>
          <Link href="/teacher" className="mt-3 inline-block text-sm font-bold text-blue-600">
            ← Dashboard
          </Link>
        </Card>
      ) : (
        <Card title="Weekly schedule">
          <TimetableGrid
            workingDays={settings.working_days}
            periodsPerDay={settings.periods_per_day}
            dayStart={settings.day_start}
            periodMinutes={settings.period_minutes}
            breakAfterPeriod={settings.break_after_period}
            breakMinutes={settings.break_minutes}
            cells={cells}
          />
        </Card>
      )}
    </Shell>
  );
}
