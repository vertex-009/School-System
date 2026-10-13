import Link from "next/link";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui";
import { TimetableGrid } from "@/components/timetable-grid";
import { primarySectionIdByClass } from "@/lib/class-label";
import { getContext } from "@/lib/session";
import { mergeSettings } from "@/lib/timetable/defaults";

type Search = { class?: string };

export default async function ViewTimetablePage({ searchParams }: { searchParams: Promise<Search> }) {
  const { supabase, schoolId } = await getContext();
  if (!schoolId) redirect("/");
  const sp = await searchParams;

  // Settings + catalog + all slot section ids in one round-trip (avoids separate count + section_id queries).
  const [{ data: settingsRow }, { data: classesRaw }, { data: sectionsRaw }, { data: slotted }] = await Promise.all([
    supabase.from("timetable_settings").select("*").eq("school_id", schoolId).maybeSingle(),
    supabase.from("classes").select("id, name, sort_order").eq("school_id", schoolId).order("sort_order").order("name"),
    supabase.from("sections").select("id, name, class_id").eq("school_id", schoolId).order("name"),
    supabase.from("timetable_slots").select("section_id, plan_status").eq("school_id", schoolId),
  ]);

  const settings = mergeSettings(settingsRow as any);
  const preferDraft = (slotted || []).some((r) => r.plan_status === "draft");
  const planFilter = preferDraft ? "draft" : "published";
  const classes = (classesRaw || []).map((c) => ({ id: c.id as string, name: c.name as string }));
  const primary = primarySectionIdByClass(sectionsRaw || []);
  const slotCount = slotted?.length ?? 0;

  const slottedSectionIds = new Set(
    (slotted || []).filter((r) => !r.plan_status || r.plan_status === planFilter).map((r) => r.section_id)
  );
  const classIdsWithSlots = new Set(
    (sectionsRaw || []).filter((s) => slottedSectionIds.has(s.id)).map((s) => s.class_id as string)
  );
  const barClasses = classes.filter((c) => classIdsWithSlots.has(c.id));
  const displayClasses = barClasses.length ? barClasses : classes;

  const activeClassId = sp.class || displayClasses[0]?.id || null;
  const activeSectionId = activeClassId ? primary.get(activeClassId) || null : null;
  const activeClassName = displayClasses.find((c) => c.id === activeClassId)?.name || "Class";

  const { data: slots } = activeSectionId
    ? await supabase
        .from("timetable_slots")
        .select("day_of_week, period_number, room_number, teacher_slot, subjects(name), profiles(name)")
        .eq("school_id", schoolId)
        .eq("section_id", activeSectionId)
        .eq("plan_status", planFilter)
        .order("day_of_week")
        .order("period_number")
    : { data: [] as any[] };

  const cells = (slots || []).map((row: any) => ({
    day_of_week: row.day_of_week as number,
    period_number: row.period_number as number,
    subject_name: row.subjects?.name as string | undefined,
    teacher_name: (row.profiles?.name as string | undefined) || `Teacher ${row.teacher_slot || "?"}`,
    room_number: row.room_number as number | undefined,
  }));

  const generatedAt = (settingsRow as any)?.generated_at as string | null;

  return (
    <Shell role="principal" title="View timetable">
      <Link href="/principal/timetable" className="text-xs font-bold text-brand-accent hover:underline">
        ← Timetable
      </Link>

      {!slotCount ? (
        <Card title="No timetable yet">
          <p className="text-sm text-slate-600">Generate a plan first from Make timetable, then come back here to view by class.</p>
        </Card>
      ) : (
        <Card
          title="Weekly timetable"
          subtitle={
            generatedAt
              ? `Last generated ${new Date(generatedAt).toLocaleString()} · ${slotCount} slots`
              : `${slotCount} slots`
          }
        >
          <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-100 pb-4">
            {displayClasses.map((c) => (
              <Link
                key={c.id}
                href={`/principal/timetable/view?class=${c.id}`}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  activeClassId === c.id ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          {cells.length ? (
            <TimetableGrid
              workingDays={settings.working_days}
              periodsPerDay={settings.periods_per_day}
              dayStart={settings.day_start}
              periodMinutes={settings.period_minutes}
              breakAfterPeriod={settings.break_after_period}
              breakMinutes={settings.break_minutes}
              cells={cells}
              title={`${activeClassName} · full week`}
            />
          ) : (
            <p className="text-sm text-slate-500">
              No periods for this class yet. Generate again including this class, or pick another class above.
            </p>
          )}
        </Card>
      )}
    </Shell>
  );
}
